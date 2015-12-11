module.exports = QueueMessageDispatcher;

var Consumer = require('sqs-consumer'),
    AWS = require('aws-sdk'),
    Q = require('q');

/**
 * We need to override the parent method, to prevent the consumer of deleting the message.
 *
 * @param message
 * @param cb
 * @private
 */
Consumer.prototype._deleteMessage = function (message, cb) {
    cb();
};

/**
 * QueueMessageDispatcher is the chain element between the queue and the event dispatcher. It provides a small
 * set of functions to interact with the queue and register for queue messages.
 *
 * @param eventEmitter
 * @constructor
 */
function QueueMessageDispatcher(eventEmitter) {
    this.eventEmitter = eventEmitter;
    this.consumer = {};
    this.endpoints = {};
}

/**
 * Creates an instance of Consumer from given endpoint data, which will be added to the internal set of consumers.
 *
 * @param endpoint
 */
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
        visibilityTimeout: 10,
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

/**
 * Purge a single queue.
 *
 * @param endpoint
 * @returns {promise}
 */
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

/**
 * Stop a single consumer.
 *
 * @param endpoint
 */
QueueMessageDispatcher.prototype.stopConsumer = function (endpoint) {
    if (endpoint.url in this.consumer && this.consumer[endpoint.url]) {
        this.consumer[endpoint.url].stop();
        delete this.consumer[endpoint.url];
    }
};

/**
 * Creates a new Queue from given endpoint configuration.
 *
 * @param endpoint
 * @returns {*|promise}
 */
QueueMessageDispatcher.prototype.createQueue = function (endpoint) {
    var deferred = Q.defer();

    this.consumer[endpoint.url].sqs.createQueue({ QueueName: endpoint.name }, function (err, data) {
        if (err) {
            return deferred.reject(err);
        }

        deferred.resolve(data);
    });

    return deferred.promise;
};
