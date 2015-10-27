module.exports = QueueController;

QueueController.$inject = ['queues'];
function QueueController (queues) {
    var vm = this;

    vm.purgeQueue = purgeQueue;

    function purgeQueue (queue) {
        console.log(queue);
        queues.purge(queue);
    }
}
