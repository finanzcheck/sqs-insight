module.exports = QueuesListController;

QueuesListController.$inject = ['queuesList', '$cookies'];
function QueuesListController (queuesList, $cookies) {
    var vm = this;

    vm.active = $cookies.get('selectedQueue') || null;
    vm.queues = [];
    vm.select = select;

    queuesList.getQueues().then(function (queues) {
        queues.forEach(function (q) {
            if (!vm.active) {
                vm.active = q;
            }

            vm.queues.push({
                name: q,
                active: vm.active === q
            });
        });
    });

    function select (queue) {
        $cookies.put('selectedQueue', queue);
    }
}
