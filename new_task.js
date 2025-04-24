const amqp = require('amqplib/callback_api');

// Connect to RabbitMQ server
// This creates a TCP connection to the RabbitMQ broker
amqp.connect('amqp://localhost:5672', (error0, connection) => {
  if (error0) {
    throw error0;
  }

  // Create a channel
  // A channel is a virtual connection inside a real TCP connection
  // Most operations are performed on the channel level
  connection.createChannel((error1, channel) => {
    if (error1) {
      throw error1;
    }

    // Declare a queue named 'task_queue'
    // In Work Queues pattern, this queue will be shared among multiple workers
    const queue = 'task_queue';

    // Get message from command line args or use default
    // Messages containing dots ('.') will simulate longer processing time in workers
    // Example: node new_task.js "task with..."
    const msg = process.argv.slice(2).join(' ') || 'Hello World!';

    // Declare a queue with durability option
    // Both producers and consumers should declare the queue with identical settings
    // 'durable: true' means the queue will survive broker restarts
    // This is important for production systems to avoid data loss
    channel.assertQueue(queue, {
      durable: true, // Queue will survive broker restarts
    });

    // Send a message to the queue
    // Buffer.from(msg) converts the string message to a buffer which RabbitMQ expects
    // 'persistent: true' marks the message as persistent
    // Note: Persistence doesn't guarantee 100% durability (depends on fsync timing)
    channel.sendToQueue(queue, Buffer.from(msg), {
      persistent: true, // Message will survive broker restarts (written to disk)
    });
    console.log(`[x] Sent '${msg}'`);

    // In a Work Queue scenario, messages are distributed using round-robin dispatching
    // This means messages will be sent to workers in sequence, one after another
    // If we have 3 workers, messages will be distributed 1->2->3->1->2->3 and so on

    // Close the connection after 500ms
    // In a real application, you might want to manage connections differently
    // For example, reusing connections for multiple messages
    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 500);
  });
});
