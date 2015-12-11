module.exports = QueueController;

QueueController.$inject = ['queues'];
function QueueController (queues) {
    var vm = this;

    vm.purgeQueue = purgeQueue;
    vm.clearQueueMessages = clearQueueMessages;
    vm.clearMessages = clearMessages;

    function purgeQueue (queue) {
        console.log(queue);
        queues.purge(queue);
    }

    function clearQueueMessages (queue) {
        console.log(queue);
        queues.clearMessages(queue);
    }

    function clearMessages () {
        queues.clearAllMessages();
    }
}
