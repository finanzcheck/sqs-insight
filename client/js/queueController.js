module.exports = QueueController;

QueueController.$inject = ['$scope', 'queues'];
function QueueController ($scope, queues) {

    $scope.purgeQueue = function (queue) {
        console.log(queue);
        queues.purge(queue)
    }
}
