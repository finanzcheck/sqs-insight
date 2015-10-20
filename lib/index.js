var browserify = require('browserify-middleware'),
    socket = require('socket.io'),
    express = require('express'),
    http = require('http'),
    fs = require('q-io/fs'),
    chalk = require('chalk'),
    util = require('util'),

    app = express(),
    server = http.Server(app),
    io = socket(server, { serveClient: false }),

    EventEmitter = require('events').EventEmitter,
    emitter = new EventEmitter(),

    QueueMessageDispatcher = require('./QueueMessageDispatcher'),
    dispatcher = new QueueMessageDispatcher(emitter),

    configLocalFile = __dirname + '/../config/config_local.json',
    configFile = __dirname + '/../config/config.json',
    config;

// http routes
app.use('/app.js', browserify(__dirname + '/../client/app.js'));
app.use('/bootstrap.css', express['static'](__dirname + '/../node_modules/bootstrap/dist/css/bootstrap.min.css'));
app.use('/', express['static'](__dirname + '/../client'));
app.get('/queues', function (req, res) {
    var names = [];
    config.endpoints.forEach(function (elem) {
        names.push(elem.url.split('/').pop());
    });
    res.json(names);
})

// load local config, is not exists use default fallback.
fs.exists(configLocalFile).then(function (exists) {
    return exists ? configLocalFile : configFile;

}).then(function (file) {
    console.log(chalk.grey(util.format('Loading config file from "%s"', file)));
    return fs.read(file);

}).then(function (json) {
    config = JSON.parse(json);
    if (!config.endpoints || typeof config.endpoints !== 'object' || config.endpoints.length < 1) {
        throw new Error('Invalid endpoints array in config');
    }

}).then(function () {
    console.log(chalk.grey(util.format('Config contains %d queues.', config.endpoints.length)));

    for(var endpointIndex in config.endpoints) {
        if (!config.endpoints.hasOwnProperty(endpointIndex)) {
            continue;
        }

        var endpoint = config.endpoints[endpointIndex];
        console.log(chalk.white('Adding consumer for ' + endpoint.url));
        dispatcher.addConsumer(endpoint);
    }

}).then(function () {
    emitter.on('queue-message', function (endpoint, message) {
        console.log(chalk.blue(util.format('Received message from queue "%s": %s', endpoint.url, JSON.stringify(message))));

        io.emit('queue-message', endpoint.url, message);
    });

    emitter.on('queue-error', function (endpoint, error) {

        if (/AWS\.SimpleQueueService\.NonExistentQueue/.test(error.message)) {
            dispatcher.stopConsumer(endpoint);
            console.log(chalk.red(util.format('Queue "%s" does not exist. Consumer was stop for that specific queue.', endpoint.url)));

            return;
        }

        /**
         * just ignore this. It seems, that AWS.SQS has a problem with receiving nothing from elasticmq.
         * @see http://www.multiasking.com/blog/xml2js-sax-js-non-whitespace-before-first-tag/
         */
        if (/Non-whitespace before first tag/.test(error.message)) {
            return;
        }

        console.log(chalk.red(util.format('Error on queue "%s": %s', endpoint.url, error.message)));
    });

    app.listen(config.port, function () {
        console.log(chalk.green('listening on port ' + config.port));
    });

}).catch(function (err) {

    console.error(err);
    console.error('exiting ... ');
    process.exit(1);
});
