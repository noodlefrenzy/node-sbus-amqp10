var Sbus = require('./index');

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
    assertOptions(settings, [ 'serviceBusHost', 'SASKeyName', 'SASKey', 'eventHubName', 'tableStoreName', 'tableStoreKey']);

    var group = settings.consumerGroup || '$Default';
    var msgVal = Math.floor(Math.random() * 10000);

    var hub = Sbus.EventHubClient(settings.serviceBusHost, settings.eventHubName, settings.SASKeyName, settings.SASKey);
    hub.getEventProcessor(group, function(err, processor) {
        if(err) {
            console.log("Unable to allocate event processor.  Error: ");
            console.log(err);
            process.exit(1);
        }

        processor.set_storage(settings.tableStoreName, settings.tableStoreKey);
        processor.init(function (rx_err, partitionId, payload) {
            if (rx_err) {
                console.log('Error receiving: ');
                console.log(rx_err);
            } else {
                console.log('Received (' + partitionId + '): ');
                console.log(payload);
                if (payload.DataValue === msgVal) {
                    console.log('Exiting after receiving expected value ' + msgVal);
                    processor.teardown(function() {
                        process.exit(1);
                    });
                }
            }
        }, function(init_err) {
            if(err) {
                console.log("Unable to init.  Error: ");
                console.log(init_err);
                process.exit(1);
            } else {
                processor.receive();
                var payloadToSend = { "DataString": "From node-sbus-amqp10", "DataValue": msgVal };
                //for (var idx=0; idx < 900; ++idx) {
                //    payloadToSend["K" + idx] = idx;
                //}
                processor.send(payloadToSend, "PK2", function(tx_err) {
                    if (tx_err) {
                        console.log('Error Sending: ');
                        console.log(tx_err);
                    }
                })
            }
        });
    });
}
