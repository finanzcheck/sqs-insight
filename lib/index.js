var socket = require('socket.io'),
    express = require('express'),
    http = require('http'),
    fs = require('q-io/fs'),
    chalk = require('chalk'),
    util = require('util'),

    app = express(),
    server = http.Server(app),
    io = socket(server),

    EventEmitter = require('events').EventEmitter,
    emitter = new EventEmitter(),

    QueueMessageDispatcher = require('./QueueMessageDispatcher'),
    dispatcher = new QueueMessageDispatcher(emitter),

    MessageCache = require('./MessageCache'),
    messageCache = new MessageCache(),

    configLocalFile = __dirname + '/../config/config_local.json',
    configFile = __dirname + '/../config/config.json',
    config,
    names = [];

// load local config, if not exists use default fallback
fs.exists(configLocalFile).then(function (exists) {
    return exists ? configLocalFile : configFile;

}).then(function (file) {
    console.log(chalk.grey(util.format('Loading config file from "%s"', file)));

    return fs.read(file);

}).then(function (json) {
    config = JSON.parse(json);

    // allow config.endpoints to be an array only
    if (!config.endpoints || typeof config.endpoints !== 'object' || config.endpoints.length < 1) {
        throw new Error('Invalid endpoints array in config');
    }

    console.log(chalk.grey(util.format('Config contains %d queues.', config.endpoints.length)));

}).then(function () {
    config.endpoints.forEach(function (endpoint) {
        // iterate all endpoints, adding the name attribute and collect them in a separate array.
        endpoint.name = endpoint.url.split('/').pop();
        names.push(endpoint.name);

        // add a consumer for each endpoint
        console.log(chalk.grey('Adding consumer for ' + endpoint.name));
        dispatcher.addConsumer(endpoint);
    });

}).then(function () {
    // on new connection, emit all previously cached messages from MessageCache.
    io.on('connection', function (socket) {
        messageCache.forEach(function (name, message) {
            socket.emit('message.' + name, message);
        });
    });

    // listen for queue message event on dispatcher, emit it to all connected sockets.
    emitter.on('queue-message', function (endpoint, message) {
        if (messageCache.addMessage(endpoint, message)) {
            io.emit('message.' + endpoint.name, message);
        }

         //console.log(chalk.blue(util.format('Received message from queue "%s": %s', endpoint.name, JSON.stringify(message))));
    });

    // listen for queue error event on dispatcher. If Queue does not exist, try to create it. Stop Consumer other.
    emitter.on('queue-error', function (endpoint, error) {
        // handle this error and print a warning. A non-existing queue is none of our business
        if (/AWS\.SimpleQueueService\.NonExistentQueue/.test(error.message)) {

            if (true !== endpoint.triedToCreate) {
                endpoint.triedToCreate = true;
                dispatcher.createQueue(endpoint).then(null, function (err) {
                    console.log(err);
                });
            }

            // stop the consumer, the queue does not exist. -.-
            dispatcher.stopConsumer(endpoint);
            messageCache.clearQueue(endpoint);
            console.log(chalk.yellow(util.format('Queue "%s" does not exist. Consumer was stop for that specific queue.', endpoint.name)));

            return;
        }

        // just ignore this error . It seems, that AWS.SQS has a problem with receiving nothing from elasticmq.
        // @see http://www.multiasking.com/blog/xml2js-sax-js-non-whitespace-before-first-tag/
        if (/Non-whitespace before first tag/.test(error.message)) {
            return;
        }

        console.log(chalk.red(util.format('Error on queue "%s": %s', endpoint.name, error.message)));
    });

}).then(function () {

    // bind express routes
    require('./routes.js')(app, io, config, messageCache, dispatcher, names);

    server.listen(config.port, function () {
        console.log(chalk.green('listening on port ' + config.port));
    });

}).catch(function (err) {

    console.error(err);
    console.error('bye bye.');
    process.exit(1);
});
