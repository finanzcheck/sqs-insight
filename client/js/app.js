var angular = require('angular');

require('angular-socket-io');

angular
    .module('sqsInsight', [require('angular-ui-bootstrap'), 'btford.socket-io', require('jsonformatter'), require('angular-cookies')])
    .factory('queueSocket', require('./queueSocketService'))
    .service('queuesList', require('./queuesListService'))
    .controller('queuesListController', require('./queuesListController'))
    .directive('messageList', require('./messageListDirective'));
