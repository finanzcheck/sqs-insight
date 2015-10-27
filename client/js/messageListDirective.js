module.exports = MessageListDirective;

MessageListDirective.$inject = ['queueSocket'];
function MessageListDirective (queueSocket) {

    return {
        restrict: 'E',
        scope: {
            queueName: '=queue'
        },
        link: function(scope) {
            scope.messages = [];
            scope.trim = trim;

            queueSocket.on('message.' + scope.queueName, function (message) {
                try {
                    message.Body = JSON.parse(message.Body);
                } catch (ignore) {}

                scope.messages.push(message);
            });

            queueSocket.on('purge.' + scope.queueName, function () {
                scope.messages = [];
            });

            function trim (body) {
                return JSON.parse(body[0] === '"' ? body.slice(1, - 1) : body);
            }
        },
        templateUrl: '/partials/messageList.html'
    };
}
