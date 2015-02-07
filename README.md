Introduction
============

[![Build Status](https://secure.travis-ci.org/noodlefrenzy/node-sbus-qpid.png?branch=master)](https://travis-ci.org/noodlefrenzy/node-sbus-qpid)
[![Dependency Status](https://david-dm.org/noodlefrenzy/node-sbus-qpid.png)](https://david-dm.org/noodlefrenzy/node-sbus-qpid)

`node-sbus-amqp10` is a simple adapter you can pass to `node-sbus` ([GitHub](https://github.com/noodlefrenzy/node-sbus)) to have it use the `node-amqp-1-0` ([GitHub](https://github.com/noodlefrenzy/node-amqp-1-0) | [NPM](https://www.npmjs.com/package/node-amqp-1-0))
module for all AMQP calls.  Since `node-amqp-1-0`, unlike `node-qpid`, has no native code dependencies
it can run on a variety of hardware platforms that are denied to Apache's Qpid Proton.

Usage
=====

This adapter is used internally by the `node-sbus` module, which it uses itself via the static `EventHubClient` and `ServiceBusClient` methods.
So to e.g. talk to Azure's EventHub, you would simply call `require('node-sbus-amqp10').EventHubClient()` and it would return a `node-sbus`
instance suitable for talking AMQP via `node-amqp-1-0`.  That complicated implementation detail is meant to make it easy for you to use the library,
however, so let's see some code!

To receive messages from all partitions of `myEventHub` in `myServiceBus`, and store state in `myTableStore`:

    // Set up variables
    var serviceBus = 'myServiceBus',
        eventHubName = 'myEventHub',
        sasKeyName = ..., // A SAS Key Name for the Event Hub, with Receive privilege
        sasKey = ..., // The key value
        tableStorageName = 'myTableStore',
        tableStorageKey = ..., // The key for the above table store
        consumerGroup = '$Default';

    var Sbus = require('node-sbus-amqp10');
    var hub = Sbus.EventHubClient(serviceBus, eventHubName, sasKeyName, sasKey);
    hub.getEventProcessor(consumerGroup, function (conn_err, processor) {
      if (conn_err) { ... do something ... } else {
        processor.set_storage(tableStorageName, tableStorageKey);
        processor.init(function (rx_err, partition, payload) {
          if (rx_err) { ... do something ... } else {
            // Process the JSON payload
          }
        }, function (init_err) {
          if (init_err) { ... do something ... } else {
            processor.receive();
          }
        });
      }
    });

For sending messages, it's even easier:

    // Set up variables as above

    var Sbus = require('node-sbus-amqp10');
    var hub = Sbus.EventHubClient(serviceBus, eventHubName, sasKeyName, sasKey);
    hub.send({ 'myJSON': 'payload' }, 'partitionKey', function(tx_err) { });

Known Issues
============

Please see `node-amqp-1-0` ([GitHub](https://github.com/noodlefrenzy/node-amqp-1-0) | [NPM](https://www.npmjs.com/package/node-amqp-1-0)) for open issues with the underlying AMQP library, and
`node-sbus` ([GitHub](https://github.com/noodlefrenzy/node-sbus) (will change to jmspring) | [NPM](https://www.npmjs.com/package/node-sbus)) for issues with the ServiceBus/EventHub wrapper.  The issues for this adapter
will be managed in its [GitHub issues page](https://github.com/noodlefrenzy/node-sbus-amqp10/issues), but the primary issue at this time is:

* No support for ServiceBus queues and topics

Adapter Details
===============

`node-sbus` relies on five simple methods to provide AMQP support - two for service bus, two for event hub, one for teardown:

* `send(uri, payload, cb)`
  * The URI should be the full AMQPS address you want to deliver to with included SAS name and key,
    e.g. amqps://sasName:sasKey@sbhost.servicebus.windows.net/myqueue.
  * The payload is a JSON payload (which might get `JSON.stringify`'d), or a string.
  * The callback takes an error, and is called when the message is sent.
* `receive(uri, cb)`
  * The URI should be the full AMQP(S) address you want to receive from, e.g. amqps://sasName:sasKey@sbhost.servicebus.windows.net/mytopic/Subscriptions/mysub.
  * The callback takes an error, a message payload, and any annotations on the message, and is called every time a message
    is received.
* `eventHubSend(uri, payload, [partitionKey], cb)`
  * The URI should be the full AMQPS address of the hub with included SAS name and key,
    e.g. amqps://sasName:sasKey@sbhost.servicebus.windows.net/myeventhub
  * The payload is a JSON payload (which might get `JSON.stringify`'d), or a string.
  * The (optional) partition key is a string that gets set as the partition key for the message (delivered in the
    message annotations).
  * The callback takes an error, and is called when the message is sent.
* `eventHubReceive(uri, [offset], cb)`
  * The URI should be the AMQPS address of the hub with included SAS name and key, consumer group suffix and partition,
    e.g. amqps://sasName:sasKey@sbhost.servicebus.windows.net/myeventhub/ConsumerGroups/_groupname_/Partition/_partition_
  * The (optional) offset should be the string offset provided by the message annotations of received messages, allowing
    connections to pick up receipt from where they left off.
  * The callback takes an error, a partition ID, a message payload, and any annotations on the message, and is called every time a message
    is received.
* `disconnect(cb)`
  * Disconnect from all open links and tear down the connection.

Any class implementing these five methods is duck-type compatible with `node-sbus` and can be used.
