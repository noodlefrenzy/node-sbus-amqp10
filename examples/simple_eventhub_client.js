var Sbus = require('../index');
// Switch to this line if you pull out this example and use it for your own codebase.
//var Sbus = require('sbus-amqp10');

function assertOptions(options, args) {
    var failed = [];
    for (var idx in args) {
        var arg = args[idx];
        if (options[arg] === undefined) failed.push(arg);
    }
    if (failed.length > 0) throw new Error('Missing required settings: ' + failed.join(', '));
}

if (process.argv.length < 3) {
    console.warn('Usage: node '+process.argv[1]+' <settings json file>');
} else {
    var settingsFile = process.argv[2];
    var settings = require('./' + settingsFile);
    assertOptions(settings, ['serviceBusHost', 'SASKeyName', 'SASKey', 'eventHubName', 'tableStoreName', 'tableStoreKey']);

    var group = settings.consumerGroup || '$Default';
    var msgVal = Math.floor(Math.random() * 10000) + 1000000;

    var sender = true;
    var receiver = true;
    if (process.argv.length > 3) {
        if (process.argv[3] === 'send') receiver = false;
        else if (process.argv[3] === 'receive') sender = false;
        else throw new Error('Unknown action.');
    }

    var payloadToSend = {"DataString": "From node-sbus-amqp10", "DataValue": msgVal};
    var pkToSend = "PK" + msgVal;

    var sendCB = function (tx_err) {
        if (tx_err) {
            console.log('Error Sending: ');
            console.log(tx_err);
        }
        if (!receiver) {
            console.log('Sent message with value ' + msgVal + '.  Not receiving, so exiting');
            process.exit(0);
        }
    };

    var receiveCB = function (processor, rx_err, partitionId, payload) {
        if (rx_err) {
            console.log('Error receiving: ');
            console.log(rx_err);
        } else {
            console.log('Received (' + partitionId + '): ', payload);
            if (sender) {
                // Not sending, so no payload to look for.
                if (payload.DataValue === msgVal) {
                    processor.teardown(function () {
                        console.log('Exiting after receiving expected value ' + msgVal);
                        process.exit(0);
                    });
                }
            }
        }
    };

    var initCB = function (processor, init_err) {
        if (init_err) {
            console.log("Unable to init.  Error: ");
            console.log(init_err);
            process.exit(1);
        } else {
            if (receiver) {
                processor.receive();
            }
            if (sender) {
                processor.send(payloadToSend, pkToSend, sendCB);
            }
        }
    };

    var hub = Sbus.EventHubClient(settings.serviceBusHost, settings.eventHubName, settings.SASKeyName, settings.SASKey);
    if (sender && !receiver) {
        hub.send(payloadToSend, pkToSend, sendCB);
    } else {
        hub.getEventProcessor(group, function (err, processor) {
            if (err) {
                console.log("Unable to allocate event processor.  Error: ");
                console.log(err);
                process.exit(1);
            }

            processor.set_storage(settings.tableStoreName, settings.tableStoreKey);
            processor.init(receiveCB.bind(null, processor), initCB.bind(null, processor));
        });
    }
}
