const amqp = require('amqplib/callback_api');

/**
 * RECEIVING LOGS WITH TOPIC ROUTING
 *
 * This file demonstrates how to receive messages based on topic patterns.
 * Topic exchanges allow for more complex routing than direct exchanges:
 * - Messages are routed based on pattern matching with wildcards
 * - Subscribers can listen to specific patterns using wildcards
 *
 * Topic syntax:
 * - Words separated by dots (e.g., "app.error.database")
 * - * (star) matches exactly one word
 * - # (hash) matches zero or more words
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
     * TOPIC EXCHANGE FOR PATTERN MATCHING
     *
     * Topic exchanges give you the power to subscribe to partial matches and multiple patterns.
     * Examples of bindings:
     * - "kern.*" - all kernel messages regardless of severity
     * - "*.critical" - all critical messages regardless of source
     * - "kern.critical" - only critical kernel messages
     * - "#" - all messages (like fanout exchange)
     */
    const exchange = 'topic_logs';

    // Ensure the exchange exists - must match the exchange in emit_log_topic.js
    channel.assertExchange(exchange, 'topic', {
      durable: false,
    });

    /**
     * QUEUE CREATION
     *
     * Each consumer gets its own exclusive, auto-delete queue with a server-generated name.
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

        // Get binding patterns from command line arguments
        const patterns = process.argv.slice(2);

        if (patterns.length === 0) {
          console.log('Usage: receive_logs_topic.js <pattern> [<pattern>...]');
          console.log('Example: receive_logs_topic.js "kern.*" "*.critical"');
          process.exit(1);
        }

        /**
         * BINDING QUEUES TO TOPIC PATTERNS
         *
         * We can bind to multiple patterns to receive specific messages.
         * Examples:
         * - "kern.*" - all kernel messages
         * - "*.critical" - all critical severity messages
         * - "#" - all messages (like fanout)
         * - "kern.*.cpu" - kernel messages about CPU with any severity
         */
        patterns.forEach((pattern) => {
          channel.bindQueue(q.queue, exchange, pattern);
          console.log(`[*] Bound to pattern: ${pattern}`);
        });

        /**
         * CONSUMING MESSAGES
         *
         * We'll only receive messages with routing keys matching our binding patterns.
         * The routing key is available in msg.fields.routingKey
         */
        channel.consume(
          q.queue,
          (msg) => {
            if (msg.content) {
              console.log(
                `[x] Received ${msg.fields.routingKey}: ${msg.content.toString()}`,
              );

              // Real-world applications:
              // - "app.error.*" could trigger alerts
              // - "*.warning.*" might update dashboards
              // - "database.#" could monitor all database activity
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
