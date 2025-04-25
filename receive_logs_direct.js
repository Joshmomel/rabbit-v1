const amqp = require('amqplib/callback_api');

/**
 * RECEIVING LOGS WITH ROUTING
 *
 * This file demonstrates how to receive messages selectively based on routing keys.
 * Unlike the fanout pattern where all messages are received, this approach allows
 * filtering messages by their severity (routing key).
 *
 * How routing works in RabbitMQ:
 * 1. Producer sends message to an exchange with a routing key
 * 2. Exchange examines the routing key
 * 3. Exchange routes message to queues with matching binding keys
 * 4. Consumers receive only relevant messages
 */

// Connect to RabbitMQ server
amqp.connect('amqp://localhost:5672', (error0, connection) => {
  if (error0) {
    throw error0;
  }

  // Create a channel
  connection.createChannel((error1, channel) => {
    if (error1) {
      throw error1;
    }

    /**
     * DIRECT EXCHANGE FOR FILTERING
     *
     * The direct exchange type allows us to selectively consume messages.
     * This is particularly useful for log filtering - we can choose to:
     * - Monitor only error messages
     * - Track only informational logs
     * - Watch multiple severity levels at once
     */
    const exchange = 'direct_logs';

    // Ensure the exchange exists - must match the exchange in emit_log_direct.js
    // The declaration must be identical across all publishers and consumers
    channel.assertExchange(exchange, 'direct', {
      durable: false,
    });

    /**
     * QUEUE CREATION
     *
     * When filtering logs, each consumer typically needs its own queue
     * with its own binding keys based on what it wants to receive.
     *
     * By leaving the queue name empty (''), we:
     * 1. Let RabbitMQ generate a random queue name for us
     * 2. Make the queue exclusive to this connection
     * 3. Auto-delete the queue when connection closes
     */
    channel.assertQueue(
      '',
      {
        exclusive: true, // Only this connection can access the queue
      },
      (error2, q) => {
        if (error2) {
          throw error2;
        }

        console.log(`[*] Waiting for logs. To exit press CTRL+C`);

        // Get severities from command line arguments
        const severities = process.argv.slice(2);

        if (severities.length === 0) {
          console.log('Usage: receive_logs_direct.js [info] [warning] [error]');
          process.exit(1);
        }

        /**
         * BINDING QUEUES TO SPECIFIC ROUTING KEYS
         *
         * This is where routing magic happens - we bind our queue to the exchange
         * with specific routing keys (severities) we want to receive.
         *
         * For example:
         * - To receive only errors: [error]
         * - To receive warnings and errors: [warning, error]
         * - To receive all logs: [info, warning, error]
         */
        severities.forEach((severity) => {
          // For each severity, create a binding between the queue and exchange
          // The binding key (severity) must match the routing key used by publishers
          channel.bindQueue(q.queue, exchange, severity);
          console.log(`[*] Bound to severity: ${severity}`);
        });

        /**
         * CONSUMING MESSAGES
         *
         * We'll only receive messages with routing keys matching our bindings.
         * The msg.fields.routingKey property contains the original routing key
         * that was used when the message was published.
         */
        channel.consume(
          q.queue,
          (msg) => {
            if (msg.content) {
              console.log(
                `[x] Received ${msg.fields.routingKey}: ${msg.content.toString()}`,
              );

              // Real-world examples:
              // - Error messages could trigger alerts
              // - Warning messages might update dashboards
              // - Info messages could be stored for later analysis
            }
          },
          {
            noAck: true, // Automatic acknowledgment
          },
        );
      },
    );
  });
});
