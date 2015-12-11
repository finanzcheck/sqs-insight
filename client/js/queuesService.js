module.exports = QueuesService;

QueuesService.$inject = ['$http', '$q'];
function QueuesService($http, $q) {

    this.getQueues = function () {
        return $http.get('/queues').then(function (response) {
            return response.data;
        });
    };

    this.purge = function (queue) {
        return $http.put('/queue/' + queue + '/purge');
    };

    this.clearMessages = function (queue) {
        return $http.put('/queue/' + queue + '/clear');
    };

    this.clearAllMessages = function () {
        return $http.put('/clear');
    };
}
