module.exports = MessageListDirective;

MessageListDirective.$inject = ['queueSocket'];
function MessageListDirective (queueSocket) {

    return {
        restrict: 'E',
        scope: {
            queueName: '=queue',
            count: '=count'
        },
        link: function(scope) {
            scope.messages = [];
            scope.trim = trim;
            scope.count = 0;
            
            queueSocket.on('message.' + scope.queueName, function (message) {
                try {
                    message.Body = JSON.parse(message.Body);
                } catch (ignore) {}

                scope.messages.push(message);
                setCount();
            });

            queueSocket.on('purge.' + scope.queueName, function () {
                scope.messages = [];
                setCount();
            });

            function trim (body) {
                return JSON.parse(body[0] === '"' ? body.slice(1, - 1) : body);
            }

            function setCount () {
                scope.count = scope.messages.length;
            }
        },
        templateUrl: '/partials/messageList.html'
    };
}
