module.exports = QueueSocketFactory;

QueueSocketFactory.$inject = ['socketFactory'];
function QueueSocketFactory (socketFactory) {
    var socket = socketFactory();

    socket.on('reconnect', function () {
        window.location.reload();
    });

    return socket;
}
