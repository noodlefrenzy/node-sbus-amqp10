var Sbus = require('./index');

main(process.argv.slice(2));

function main(args) {
    if (args.length == 0) {
        console.log('specify settings file');
        return;
    }

    var settings = require('./' + args[0]);

    sendMessages(settings, args.slice(1));
}


function sendMessages(settings, args) {
    var count = args.length > 0 ? args[0] : 64; // just an example
    var countSent = 0;

    var group = settings.consumerGroup || '$Default';

    var hub = Sbus.EventHubClient(
        settings.serviceBusHost,
        settings.eventHubName,
        settings.SASKeyName,
        settings.SASKey
    );

    hub.getEventProcessor(group, function(err, processor) {
        if(err) {
            console.log("Unable to allocate event processor. Error:", err);
            process.exit(1);
        }

        processor.set_storage(settings.tableStoreName, settings.tableStoreKey);
        processor.init(function () {}, function(err) {
            if(err) {
                console.log("Unable to init. Error:", err);
                process.exit(1);
            }

            for (var i = 0; i < count; ++i) {
                var value = Math.floor(Math.random() * 10000).toString();
                var partitionKey = Math.floor(Math.random() * 10000).toString();

                var payloadToSend = {
                    "DataString": "From node-sbus-amqp10",
                    "DataValue": value
                };

                processor.send(payloadToSend, partitionKey, function (err) {
                    if (err) {
                        console.log('Error Sending: ', err);
                    } else {
                        console.log('Sent messages:', ++countSent)
                    }
                })
            }

        });
    });
}

