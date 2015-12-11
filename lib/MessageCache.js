module.exports = MessageCache;

/**
 * A lightweight cache for messages, identified by the MessageId of each message.
 *
 * @param {int} rememberMessages
 * @constructor
 */
function MessageCache (rememberMessages) {
    this.messages = {};
    this.knownMessageIds = [];
    this.rememberMessages = rememberMessages;
}

/**
 * Adds a message to the cache of given endpoint.
 * @param {object} endpoint
 * @param {object} message
 * @returns {boolean}
 */
MessageCache.prototype.addMessage = function (endpoint, message) {
    if (!this.messages[endpoint.name]) {
        this.messages[endpoint.name] = [];
    }

    if (this.knownMessageIds.indexOf(message.MessageId) > -1) {
        return false;
    }

    this.messages[endpoint.name].push(message);
    this.messages[endpoint.name] = this.messages[endpoint.name].slice(-1 * this.rememberMessages);
    this.knownMessageIds.push(message.MessageId);

    return true;
};

/**
 * Removes a message from the cache of given endpoint.
 * @param {object} endpoint
 * @param {object} message
 */
MessageCache.prototype.removeMessage = function (endpoint, message) {
    if (!this.messages[endpoint.name]) {
        return;
    }

    var index = this.messages[endpoint.name].indexOf(message);
    if (index > -1) {
        this.messages[endpoint.name].splice(index, 1);

        index = this.knownMessageIds.indexOf(message.MessageId);
        if (index > -1) {
            this.knownMessageIds.splice(index, 1);
        }
    }
};

/**
 * Clears a single specific queue cache, identified by endpoint.
 *
 * @param {object} endpoint
 */
MessageCache.prototype.clearQueue = function (endpoint) {
    if (!this.messages[endpoint.name]) {
        return;
    }

    var that = this;
    this.messages[endpoint.name].forEach(function (message) {
        that.removeMessage(endpoint, message);
    });
};

/**
 * Clears the whole cache.
 */
MessageCache.prototype.clear = function () {
    this.messages = {};
    this.knownMessageIds = [];
};

/**
 * Iterates over all cached messages of all queues, calling the callback for each message.
 * @param {function} callback
 */
MessageCache.prototype.forEach = function (callback) {
    var that = this;
    Object.keys(that.messages).forEach(function (name) {
        that.messages[name].forEach(function (message) {
            callback(name, message);
        });
    });
};

/**
 * Iterates over all cached messages of a single queue, identified by given endpoint, calling the callback for each message.
 *
 * @param {object} endpoint
 * @param {function} callback
 */
MessageCache.prototype.forEachQueue = function (endpoint, callback) {
    this.messages[endpoint.name].forEach(function (message) {
        callback(message);
    });
};
