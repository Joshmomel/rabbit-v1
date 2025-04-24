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

    // Declare a queue
    const queue = 'hello';
    const msg = 'Hello World!';

    // Declare a queue named 'hello'
    // The assertQueue method ensures the queue exists, creating it if it doesn't
    // Setting durable: false means the queue won't survive broker restarts
    // This is fine for simple examples but in production, you'd typically want durable: true
    channel.assertQueue(queue, {
      durable: false,
    });

    // Send a message to the queue
    channel.sendToQueue(queue, Buffer.from(msg));
    console.log(`[x] Sent ${msg}`);

    // Close the connection after 500ms
    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 500);
  });
});
