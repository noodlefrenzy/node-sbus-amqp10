var AMQPClient      = require('node-amqp-1-0'),
    Builder         = require('node-amqp-encoder').Builder,
    Sbus            = require('node-sbus');


function generateOffsetFilter(offset) {
    var filter = null;
    if (offset) {
        filter = {
            'apache.org:selector-filter:string':
                AMQPClient.adapters.Translator(new Builder().described().
                    symbol("apache.org:selector-filter:string").
                    string("amqp.annotation.x-opt-offset > '" + offset + "'").encode())
        };
    }
    return filter;
}

function SbusAdapter() {
    this.eventHubClient = null;
    this.serviceBusClient = null;
}

SbusAdapter.prototype.send = function(uri, payload, cb) {
    throw new Error('Not yet implemented.');
};

SbusAdapter.prototype.receive = function(uri, cb) {
    throw new Error('Not yet implemented.');
};

SbusAdapter.prototype.eventHubSend = function(uri, payload, partitionKey, cb){
    if (cb === undefined) {
        cb = partitionKey;
        partitionKey = undefined;
    }

    var annotations;
    if(partitionKey) {
        annotations = { 'x-opt-partition-key': partitionKey };
    }

    if (!this.eventHubClient) {
        this.eventHubClient = new AMQPClient(AMQPClient.policies.EventHubPolicy);
    }

    this.eventHubClient.send(payload, uri, annotations, cb);
};

SbusAdapter.prototype.eventHubReceive = function(uri, offset, cb) {
    if (cb === undefined) {
        cb = offset;
        offset = undefined;
    }

    var filter = generateOffsetFilter(offset);

    if (!this.eventHubClient) {
        this.eventHubClient = new AMQPClient(AMQPClient.policies.EventHubPolicy);
    }

    this.eventHubClient.receive(uri, filter, cb);
};

SbusAdapter.prototype.disconnect = function(cb) {

};

module.exports = SbusAdapter;
