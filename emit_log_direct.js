const amqp = require('amqplib/callback_api');

/**
 * ROUTING PATTERN IN RABBITMQ
 *
 * In the previous example (emit_log.js), we built a simple logging system using a fanout exchange.
 * A fanout exchange broadcasts all messages to all bound queues without filtering.
 *
 * This file implements a more selective approach using a direct exchange.
 * With direct exchanges, messages are routed based on their routing key.
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
     * DIRECT EXCHANGE
     *
     * A direct exchange delivers messages to queues based on the message routing key.
     *
     * Key features:
     * - Each queue binds to the exchange with one or more routing keys
     * - Messages are routed to queues where binding key = routing key
     * - Multiple queues can bind with the same key (like multicast)
     * - A queue can bind with multiple keys (receiving different message types)
     */
    const exchange = 'direct_logs';

    // Create exchange of type 'direct'
    // Parameters:
    // - exchange name: 'direct_logs'
    // - type: 'direct' (routes based on exact routing key match)
    // - options: {durable: false} (exchange won't survive broker restart)
    channel.assertExchange(exchange, 'direct', {
      durable: false,
    });

    // Get severity level from command line arguments or default to 'info'
    // This severity will be used as the routing key to determine which queues receive the message
    const severity = process.argv[2] || 'info';

    // Get message from command line arguments or use default
    // We can now filter log messages by severity
    const msg = process.argv.slice(3).join(' ') || 'Hello World!';

    /**
     * PUBLISHING WITH ROUTING KEY
     *
     * In the previous fanout example, we used an empty string as the routing key.
     * For direct exchanges, the routing key is important as it determines which queues receive the message.
     *
     * Common log severity levels:
     * - info: Informational messages
     * - warning: Warning conditions
     * - error: Error conditions
     */
    // Publish message to the direct exchange with the severity as routing key
    // Only queues bound to this specific severity/routing key will receive the message
    channel.publish(exchange, severity, Buffer.from(msg));
    console.log(`[x] Sent ${severity}: ${msg}`);

    // Close the connection after 500ms
    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 500);
  });
});
