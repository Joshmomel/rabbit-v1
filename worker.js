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

    // Declare the same queue as in new_task.js
    // All workers must use the same queue name to participate in the work distribution
    const queue = 'task_queue';

    // Declare the queue with durability option
    // 'durable: true' means the queue will survive broker restarts
    // Important: Both the producer and all consumers must declare the queue with identical settings
    channel.assertQueue(queue, {
      durable: true, // Queue will survive broker restarts
    });

    // Process only one message at a time
    // This is a key setting for work queues with multiple workers!
    // prefetch(1) tells RabbitMQ not to give more than one message to a worker at a time
    // Without this, RabbitMQ would just send messages in a strict round-robin fashion,
    // potentially giving many messages to busy workers while others are idle
    channel.prefetch(1);

    console.log(`[*] Waiting for messages in ${queue}. To exit press CTRL+C`);

    // Consume messages from the queue
    // The callback function is executed whenever a message is received
    channel.consume(
      queue,
      (msg) => {
        // Parse the message content from buffer to string
        const content = msg.content.toString();
        console.log(`[x] Received '${content}'`);

        // Simulate processing time with dots in the message
        // Each dot represents one second of "work"
        // This simulates tasks of varying complexity
        const secs = content.split('.').length - 1;
        console.log(`[x] Task takes ${secs} seconds`);

        // Simulate actual work with a setTimeout
        // In a real application, this would be your actual task processing logic
        setTimeout(() => {
          console.log('[x] Done');

          // Acknowledge message processing completion
          // This is CRITICAL for proper work queue behavior!
          // It tells RabbitMQ that this message has been processed and can be discarded
          // If a worker dies without sending an ack, RabbitMQ will re-queue the message
          // This ensures no messages are lost, even if workers crash
          channel.ack(msg);

          // Without acknowledgments, messages would be lost when a worker dies
          // With acknowledgments and prefetch(1), messages are redelivered to other workers
        }, secs * 1000);
      },
      {
        // Manual acknowledgment mode
        // noAck: false tells RabbitMQ that the consumer will explicitly acknowledge messages
        // This is opposed to auto-acknowledgment (noAck: true) which acknowledges messages immediately
        noAck: false,
      },
    );

    // NOTE ON ROUND-ROBIN DISPATCHING:
    // - RabbitMQ distributes messages in a round-robin fashion by default
    // - If you have multiple workers, each will get a fair share of messages in sequence
    // - Combined with prefetch(1) and manual acks, this creates a "fair dispatch" system
    // - Workers only get new messages when they've finished processing their current one
  });
});
