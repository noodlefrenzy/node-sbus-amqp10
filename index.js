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
    this.eventHubClient = new AMQPClient(AMQPClient.policies.EventHubPolicy);
    this.serviceBusClient = new AMQPClient(AMQPClient.policies.ServiceBusQueuePolicy);
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

    this.eventHubClient.send(payload, uri, annotations, cb);
};

SbusAdapter.prototype.eventHubReceive = function(uri, offset, cb) {
    if (cb === undefined) {
        cb = offset;
        offset = undefined;
    }

    var filter = generateOffsetFilter(offset);

    var partitionId = uri.substring(uri.lastIndexOf('/') + 1);
    this.eventHubClient.receive(uri, filter, function(err, payload, annotations) {
        cb(err, partitionId, payload, annotations.value);
    });
};

SbusAdapter.prototype.disconnect = function(cb) {
    var self = this;
    if (this.eventHubClient) {
        this.eventHubClient.disconnect(function () {
            self.eventHubClient = null;
            self.disconnect(cb); // Teardown service bus if connected.
        });
    } else if (this.serviceBusClient) {
        this.serviceBusClient.disconnect(function() {
            self.serviceBusClient = null;
            cb();
        });
    } else {
        cb();
    }
};

SbusAdapter.EventHubClient = function(serviceBusNamespace, eventHubName, sasName, sasKey) {
    return Sbus.eventhub.EventHub.Instance(serviceBusNamespace, eventHubName, sasName, sasKey, new SbusAdapter());
};

module.exports = SbusAdapter;
