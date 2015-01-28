var AMQPClient      = require('node-amqp-1-0'),
    Sbus            = require('node-sbus');

function SbusAdapter(policy) {
    this.client = new AMQPClient(policy);
}

SbusAdapter.prototype.send = function(options, cb){

};

SbusAdapter.prototype.receive = function(options, cb) {

};

SbusAdapter.prototype.disconnect = function(uri, cb) {

};

SbusAdapter.EventHubClient = function() {
    return new SbusAdapter(AMQPClient.policies.EventHubPolicy);
};

SbusAdapter.ServiceBusClient = function() {
    return new SbusAdapter(AMQPClient.policies.ServiceBusQueuePolicy);
};

module.exports = SbusAdapter;
