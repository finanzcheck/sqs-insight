module.exports = QueueMessageDispatcher;

var Consumer = require('sqs-consumer'),
    AWS = require('aws-sdk'),
    Q = require('q');

Consumer.prototype._deleteMessage = function (message, cb) {
    cb();
};

function QueueMessageDispatcher(eventEmitter) {
    this.eventEmitter = eventEmitter;
    this.consumer = {};
    this.endpoints = {};
}

QueueMessageDispatcher.prototype.addConsumer = function (endpoint) {
    var that = this;

    AWS.config.update({
        region: endpoint.region,
        accessKeyId: endpoint.key,
        secretAccessKey: endpoint.secretKey
    });

    var consumer = Consumer.create({
        sqs: new AWS.SQS(),
        region: endpoint.region,
        queueUrl: endpoint.url,
        batchSize: 1,
        visibilityTimeout: 1,
        waitTimeSeconds: 20,

        handleMessage: function (message, done) {
            that.eventEmitter.emit('queue-message', endpoint, message);
            done();
        }
    });

    consumer.on('error', function (err) {
        that.eventEmitter.emit('queue-error', endpoint, err);
    });

    consumer.start();

    this.consumer[endpoint.url] = consumer;
    this.endpoints[endpoint.name] = endpoint;
};

QueueMessageDispatcher.prototype.purgeQueue = function (endpoint) {
    var deferred = Q.defer();

    this.consumer[endpoint.url].sqs.purgeQueue({ QueueUrl: endpoint.url }, function (err, data) {
        if (err) {
            return deferred.reject(err);
        }

        deferred.resolve(data);
    });

    return deferred.promise;
};

QueueMessageDispatcher.prototype.stopConsumer = function (endpoint) {
    if (endpoint.url in this.consumer && this.consumer[endpoint.url]) {
        this.consumer[endpoint.url].stop();
        delete this.consumer[endpoint.url];
    }
};
