var angular = require('angular');

require('angular-socket-io');

angular
    .module('sqsInsight', [require('angular-ui-bootstrap'), 'btford.socket-io', require('jsonformatter'), require('angular-cookies')])
    .factory('queueSocket', require('./queueSocketService'))
    .service('queues', require('./queuesService'))
    .controller('queuesListController', require('./queuesListController'))
    .controller('queueController', require('./queueController'))
    .directive('messageList', require('./messageListDirective'));
