module.exports = MessageCache;

function MessageCache (rememberMessages) {
    this.messages = {};
    this.knownMessageIds = [];
    this.rememberMessages = rememberMessages;
}

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

MessageCache.prototype.clearQueue = function (endpoint) {
    if (!this.messages[endpoint.name]) {
        return;
    }

    var that = this;
    this.messages[endpoint.name].forEach(function (message) {
        that.removeMessage(endpoint, message);
    });
};

MessageCache.prototype.clear = function () {
    this.messages = {};
    this.knownMessageIds = [];
};

MessageCache.prototype.forEach = function (callback) {
    var that = this;
    Object.keys(that.messages).forEach(function (name) {
        that.messages[name].forEach(function (message) {
            callback(name, message);
        });
    });
};

MessageCache.prototype.forEachQueue = function (endpoint, callback) {
    this.messages[endpoint.name].forEach(function (message) {
        callback(message);
    });
};
