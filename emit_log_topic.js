const amqp = require('amqplib/callback_api');

/**
 * TOPIC EXCHANGE PATTERN IN RABBITMQ
 *
 * This file implements a topic exchange, which routes messages to queues based on wildcard matches
 * between the routing key and the binding pattern.
 *
 * Topic routing keys must be a list of words delimited by dots, such as "quick.orange.rabbit"
 *
 * Special characters in bindings:
 * * (star) - substitutes exactly one word
 * # (hash) - substitutes zero or more words
 *
 * Examples:
 * - "*.orange.*" matches "quick.orange.rabbit" or "lazy.orange.elephant"
 * - "*.*.rabbit" matches "quick.orange.rabbit" but not "quick.orange.fox"
 * - "lazy.#" matches "lazy.orange", "lazy.pink.rabbit", etc.
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
     * TOPIC EXCHANGE
     *
     * Topic exchanges route messages based on patterns in the routing key.
     * This is more flexible than direct exchanges.
     */
    const exchange = 'topic_logs';

    // Create exchange of type 'topic'
    channel.assertExchange(exchange, 'topic', {
      durable: false,
    });

    // Get routing key from command line or use default
    // Format should be: <facility>.<severity>.<category>
    // Example: "kern.critical.disk", "app.info.startup"
    const routingKey = process.argv[2] || 'anonymous.info';

    // Get message from command line arguments or use default
    const msg = process.argv.slice(3).join(' ') || 'Hello World!';

    /**
     * PUBLISHING WITH TOPIC ROUTING KEY
     *
     * The routing key for topic exchanges should be a series of words separated by dots.
     * Common pattern: <source>.<severity>.<component>
     */
    channel.publish(exchange, routingKey, Buffer.from(msg));
    console.log(`[x] Sent ${routingKey}: ${msg}`);

    // Close the connection after 500ms
    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 500);
  });
});
