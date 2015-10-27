var browserify = require('browserify-middleware'),
    socket = require('socket.io'),
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
    messages = {},
    knownMessageIds = [],

    QueueMessageDispatcher = require('./QueueMessageDispatcher'),
    dispatcher = new QueueMessageDispatcher(emitter),

    configLocalFile = __dirname + '/../config/config_local.json',
    configFile = __dirname + '/../config/config.json',
    config,
    names = [];

// our frontend javascript code is rendered by browserify, yay
app.use('/app.js', browserify(__dirname + '/../client/js/app.js'));

// bootstrap css has to be served statically
app.use('/bootstrap.css', express['static'](__dirname + '/../node_modules/bootstrap/dist/css/bootstrap.min.css'));
app.use('/json-formatter.css', express['static'](__dirname + '/../node_modules/jsonformatter/dist/json-formatter.min.css'));

// provide an api endpoint to receive all available queues, so the frontend knows which events to bind to
app.get('/queues', function (req, res) {
    res.json(names);
});

app.put('/queue/:name/purge', function (req, res) {
    var queueName = req.param('name');
    console.log(queueName);
    var endpoint;
    config.endpoints.forEach(function (e) {
        if (queueName === e.name) {
            endpoint = e;
            return false;
        }
    });
    if (!endpoint) {
        return res.sendStatus(404);
    }

    dispatcher.purgeQueue(endpoint).then(function () {
        io.emit('purge.' + endpoint.name);
        res.sendStatus(204);

    }, function (err) {
        res.status(500).send(err);
    });
});

// static html
app.use('/', express['static'](__dirname + '/../client/public'));

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
    for(var endpointIndex in config.endpoints) {
        if (!config.endpoints.hasOwnProperty(endpointIndex)) {
            continue;
        }

        var endpoint = config.endpoints[endpointIndex];
        endpoint.name = endpoint.url.split('/').pop();
        console.log(chalk.grey('Adding consumer for ' + endpoint.name));
        names.push(endpoint.name);

        dispatcher.addConsumer(endpoint);
    }

}).then(function () {
    io.on('connection', function (socket) {
        Object.keys(messages).forEach(function (name) {
            messages[name].forEach(function (message) {
                socket.emit('message.' + name, message);
            });
        });
    });

    emitter.on('queue-message', function (endpoint, message) {
        if (!messages[endpoint.name]) {
            messages[endpoint.name] = [];
        }

        if (knownMessageIds.indexOf(message.MessageId) > -1) {
            return;
        }

        messages[endpoint.name].push(message);
        messages[endpoint.name] = messages[endpoint.name].slice(-1 * config.rememberMessages);
        knownMessageIds.push(message.MessageId);

        io.emit('message.' + endpoint.name, message);

        console.log(chalk.blue(util.format('Received message from queue "%s": %s', endpoint.name, JSON.stringify(message))));
    });

    emitter.on('queue-error', function (endpoint, error) {

        // handle this error and print a warning. A non-existing queue is none of our business
        if (/AWS\.SimpleQueueService\.NonExistentQueue/.test(error.message)) {
            dispatcher.stopConsumer(endpoint);
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

    server.listen(config.port, function () {
        console.log(chalk.green('listening on port ' + config.port));
    });

}).catch(function (err) {
    console.error(err);
    console.error('bye bye.');
    process.exit(1);
});
