const amqp = require('amqplib/callback_api');

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

    // Declare the same queue as in send.js
    const queue = 'hello';

    // Declare the queue with assertQueue
    // Both sender and receiver need to declare the queue
    // The first one that connects will create it
    // We use the same parameters as the sender to ensure compatibility
    channel.assertQueue(queue, {
      durable: false, // Queue won't survive broker restarts
    });

    console.log(`[*] Waiting for messages in ${queue}. To exit press CTRL+C`);

    // Consume messages from the queue
    channel.consume(
      queue,
      (msg) => {
        console.log(`[x] Received ${msg.content.toString()}`);
      },
      {
        noAck: true,
      },
    );
  });
});
