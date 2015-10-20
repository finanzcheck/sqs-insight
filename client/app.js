require('bootstrap');
require('socket.io-client');
require('angular-socket-io');

var angular = require('angular');

angular
    .module('sqsInsight', [require('angular-ui-bootstrap'), 'btford.socket-io'])
    .directive('sqsInsight', require('./sqsInsightDirective'));
