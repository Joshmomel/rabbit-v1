const amqp = require('amqplib/callback_api');

// Connect to RabbitMQ server
// This establishes a TCP connection to the RabbitMQ broker
amqp.connect('amqp://localhost:5672', (error0, connection) => {
  if (error0) {
    throw error0;
  }

  // Create a channel
  // A channel is a virtual connection inside the TCP connection
  // It's where most of the API for getting things done resides
  connection.createChannel((error1, channel) => {
    if (error1) {
      throw error1;
    }

    // Declare an exchange of type 'fanout'
    // Exchanges are message routing agents in RabbitMQ, they receive messages from producers
    // and route them to queues based on different rules
    //
    // Exchange types:
    // - fanout: broadcasts all messages to all queues (ignores routing keys)
    // - direct: routes messages to queues based on exact routing key matching
    // - topic: routes based on wildcard pattern matching of routing keys
    // - headers: routes based on message header attributes
    const exchange = 'logs';

    // assertExchange ensures the exchange exists, creating it if it doesn't
    // Parameters:
    // - exchange name: 'logs'
    // - type: 'fanout' (broadcasts to all bound queues)
    // - options: {durable: false} (exchange won't survive broker restart)
    channel.assertExchange(exchange, 'fanout', {
      durable: false,
    });

    // Create a message from command line arguments or use default
    // process.argv[0] is 'node', process.argv[1] is the script path
    // so we take all args from index 2 onwards
    const msg = process.argv.slice(2).join(' ') || 'info: Hello World!';

    // Publish the message to the exchange
    // Parameters:
    // - exchange name: 'logs'
    // - routing key: '' (empty string - not used by fanout exchanges)
    // - message content: converted to Buffer
    //
    // With fanout exchanges, the routing key is ignored but required by the API
    channel.publish(exchange, '', Buffer.from(msg));
    console.log(`[x] Sent ${msg}`);

    // Close the connection after 500ms
    // This gives time for the message to be sent before the program exits
    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 500);
  });
});
