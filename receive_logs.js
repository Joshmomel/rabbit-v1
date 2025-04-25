const amqp = require('amqplib/callback_api');

// Connect to RabbitMQ server
// This establishes a TCP connection to the RabbitMQ broker
amqp.connect('amqp://localhost:5672', (error0, connection) => {
  if (error0) {
    throw error0;
  }

  // Create a channel
  // A channel is a virtual connection inside the TCP connection
  // Multiple channels can share a single TCP connection
  connection.createChannel((error1, channel) => {
    if (error1) {
      throw error1;
    }

    // Declare the same exchange as in emit_log.js
    // The exchange must be declared in both publisher and subscriber
    // Whichever starts first will create it
    const exchange = 'logs';

    // Ensure the exchange exists
    // Parameters:
    // - exchange name: 'logs'
    // - type: 'fanout' (broadcasts to all bound queues)
    // - options: {durable: false} (exchange won't survive broker restart)
    channel.assertExchange(exchange, 'fanout', {
      durable: false,
    });

    // Create a non-durable, exclusive, auto-delete queue with a generated name
    // Parameters:
    // - queue name: '' (empty string tells RabbitMQ to generate a random queue name)
    // - options:
    //   - exclusive: true (only this connection can use the queue, queue is deleted when connection closes)
    //   - this creates a temporary queue that's deleted when the consumer disconnects
    channel.assertQueue(
      '',
      {
        exclusive: true,
      },
      (error2, q) => {
        if (error2) {
          throw error2;
        }

        console.log(
          `[*] Waiting for messages in ${q.queue}. To exit press CTRL+C`,
        );

        // Bind the queue to the exchange
        // This tells RabbitMQ that this queue is interested in messages from this exchange
        // Parameters:
        // - queue name: q.queue (the generated queue name)
        // - exchange name: 'logs'
        // - routing key: '' (empty string - fanout exchanges ignore this, but it's required)
        channel.bindQueue(q.queue, exchange, '');

        // Consume messages from the queue
        // This sets up a subscription to the queue
        // Parameters:
        // - queue name: q.queue (the generated queue name)
        // - callback: function to call with each message
        // - options: {noAck: true} (automatically acknowledge message receipt)
        channel.consume(
          q.queue,
          (msg) => {
            if (msg.content) {
              console.log(`[x] Received ${msg.content.toString()}`);

              // Note: In a production system, you might process the message here
              // Examples:
              // - Saving logs to a database
              // - Sending notifications based on log contents
              // - Triggering alerts for specific message patterns
            }
          },
          {
            // noAck: true means messages are automatically acknowledged (removed from queue)
            // This is fine for simple log distribution, but for critical messages
            // you might set noAck: false and manually acknowledge after processing
            noAck: true,
          },
        );
      },
    );
  });
});
