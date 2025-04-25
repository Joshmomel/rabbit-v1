# RabbitMQ Learning Project

A simple project to learn and practice RabbitMQ messaging patterns.

## Prerequisites

- Node.js
- RabbitMQ server running locally or accessible remotely

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   yarn install
   ```

## Running the Examples

This project contains several examples demonstrating different RabbitMQ patterns. You can pass additional arguments to any of these commands as needed.

### Basic Send/Receive

Simple point-to-point messaging:

```
yarn send       # Send a "Hello World" message
yarn receive    # Receive messages
```

### Work Queues

Distribute tasks among workers:

```
yarn new-task [message...]   # Add a new task to the queue with optional message
yarn worker                  # Start a worker to process tasks
```

#### Work Queues Examples

Send tasks with different processing times (dots represent seconds of work):

```
yarn new-task "First task."
yarn new-task "Second task.."
yarn new-task "Third complex task....."
```

Start multiple workers to process tasks in parallel:

```
# In terminal 1
yarn worker

# In terminal 2
yarn worker
```

### Publish/Subscribe

Broadcast messages to multiple consumers:

```
yarn emit-log [message...]        # Publish log messages
yarn receive-logs                 # Subscribe to log messages
```

#### Publish/Subscribe Examples

Send broadcast messages to all listeners:

```
yarn emit-log "System starting up"
yarn emit-log "Processing batch job"
yarn emit-log "System shutting down"
```

Start multiple consumers to receive all messages:

```
# In terminal 1
yarn receive-logs

# In terminal 2
yarn receive-logs
```

### Routing

Receive messages selectively based on routing key:

```
yarn emit-log-direct [severity] [message...]      # Emit logs with routing
yarn receive-logs-direct [severity...]            # Receive specific logs
```

#### Routing Examples

Send messages with different severity levels:

```
yarn emit-log-direct "info" "Application started"
yarn emit-log-direct "warning" "Resource usage high"
yarn emit-log-direct "error" "Database connection failed"
```

Receive only specific message types:

```
# In terminal 1 - receive only errors
yarn receive-logs-direct "error"

# In terminal 2 - receive warnings and errors
yarn receive-logs-direct "warning" "error"

# In terminal 3 - receive all severities
yarn receive-logs-direct "info" "warning" "error"
```

### Topics

Receive messages based on pattern matching:

```
yarn emit-log-topic [topic] [message...]       # Emit logs with topic
yarn receive-logs-topic [pattern...]           # Subscribe to specific topics
```

#### Topic Examples

Send messages with specific topic routing keys:

```
yarn emit-log-topic "kern.critical" "System crash detected"
yarn emit-log-topic "auth.warning" "Login attempt failed"
yarn emit-log-topic "app.payment.success" "Payment processed successfully"
```

Receive messages by subscribing to specific patterns:

```
yarn receive-logs-topic "kern.*"        # All kernel messages
yarn receive-logs-topic "*.critical"    # All critical messages
yarn receive-logs-topic "app.#"         # All application messages (# matches zero or more words)
```

## Project Structure

Each example consists of sender and receiver scripts demonstrating different messaging patterns.

## Dependencies

- amqplib: ^0.10.7 - Node.js client for RabbitMQ
