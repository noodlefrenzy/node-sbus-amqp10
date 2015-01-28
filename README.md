Introduction
============

`node-sbus-amqp10` is a simple adapter you can pass to `node-sbus` to have it use the `node-amqp-1-0`
 module for all AMQP calls.  Since `node-amqp-1-0`, unlike `node-qpid`, has no native code dependencies
 it can run on a variety of hardware platforms that are denied to Apache's Qpid Proton.

 Details
 =======

 `node-sbus` relies on three simple methods to provide AMQP support:

* `send({ address: uri, annotations: annotations, body: payload, cb)`
  * The URI should be the full AMQP(S) address you want to deliver to, e.g. amqps://sbhost.servicebus.windows.net/myqueue.
  * The (optional) annotations is a simple map of key/value pairs that will get converted to an amqp:fields type for amqp:message-annotations.
    Alternately, it can be a structured AMQP map in the format defined by `node-amqp-encoder`.
  * The body is a JSON payload (which might get `JSON.stringify`'d), or a string.
  * The callback takes an error, and is called when the message is sent.
* `receive({ address: uri, filter: filter, cb)`
  * The URI should be the full AMQP(S) address you want to receive from, e.g. amqps://sbhost.servicebus.windows.net/mytopic/Subscriptions/mysub.
  * The (optional) filter is a simple map of key/value pairs that will get converted to an amqp:fields type and used for establishing the link.
    Alternately, it can be a structured AMQP map in the format defined by `node-amqp-encoder`.
  * The callback takes an error, a message payload, and any annotations on the message, and is called every time a message
    is received.
* `disconnect(uri, cb)`
  * If a URI is not provided, it will disconnect from all open links and tear down the connection.  If one is provided, it
    should tear down only those links matching the URI.  If multiple links match the same URI (e.g. sending/receiving to the same
    queue), they will all get torn down.  If all links are torn down as a consequence, we will tear down the connection as well.

Any class implementing these three methods is duck-type compatible with `node-sbus` and can be used.
