var browserify = require('browserify-middleware'),
    express = require('express');

module.exports = function (app, io, config, messageCache, names) {

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
        var endpoint = findEndpoint(config, req.params['name']);
        if (!endpoint) {
            return res.sendStatus(404);
        }

        dispatcher.purgeQueue(endpoint).then(function () {
            messageCache.clearQueue(endpoint);
            io.emit('purge.' + endpoint.name);
            res.sendStatus(204);

        }, function (err) {
            res.status(500).send(err);
        });
    });

    app.put('/queue/:name/clear', function (req, res) {
        var endpoint = findEndpoint(config, req.params['name']);
        if (!endpoint) {
            return res.sendStatus(404);
        }

        messageCache.clearQueue(endpoint);
        io.emit('purge.' + endpoint.name);
        res.sendStatus(204);
    });

    app.put('/clear', function (req, res) {
        messageCache.clear();

        config.endpoints.forEach(function (endpoint) {
            io.emit('purge.' + endpoint.name);
        });

        res.sendStatus(204);
    });

    // static html
    app.use('/', express['static'](__dirname + '/../client/public'));
};

function findEndpoint (config, name) {
    var endpoint = null;
    config.endpoints.forEach(function (e) {
        if (name === e.name) {
            endpoint = e;
            return false;
        }
    });

    return endpoint;
}
