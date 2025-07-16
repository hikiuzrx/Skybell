<p align="center">
  <img src="https://i.imgur.com/qW4jzE6.png" alt="SkyBell Logo" width="400" />
</p>

<p align="center">
  <strong>Plug-and-Play Notification Service</strong>
</p>

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" alt="NestJS" height="40" />
  <img src="https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg" alt="TypeScript" height="40" />
  <img src="https://grpc.io/img/logos/grpc-logo.png" alt="gRPC" height="40" />
  <img src="https://1000logos.net/wp-content/uploads/2020/08/Redis-Logo-500x313.jpg" alt="Redis" height="40" />
</p>

# SkyBell Notification Service

A plug-and-play, scalable microservice for real-time notifications using NestJS, Socket.IO, gRPC, and Redis. SkyBell provides a complete solution for delivering notifications across web and mobile platforms with support for WebSockets, push notifications, and background processing.

## Key Features

- **Plug-and-Play Integration**: Simple client registration and connection process
- **Multi-Channel Delivery**: WebSockets for real-time + FCM for push notifications
- **Dynamic Client Namespaces**: Secure separation between different applications
- **JWT-based Authentication**: Secure your notification channels with minimal effort
- **Multiple APIs**:
  - REST API for adding notification jobs to the queue
  - gRPC services for high-performance client registration
  - Socket.IO for real-time notification delivery
- **Centralized Processing**: All notification delivery handled by BullMQ workers
- **Scalable Infrastructure**:
  - Redis for distributed connection management and pub/sub
  - MongoDB for persistent storage of clients and settings
  - BullMQ for reliable background job processing and retries
- **Developer-Friendly**:
  - Detailed logging and monitoring
  - Swagger documentation
  - Docker deployment support

## Project Structure

```bash
├── bun.lock
├── docker-compose.yml
├── Dockerfile
├── index.ts
├── logs
│   ├── app.log
│   └── error.log
├── nest-cli.json
├── package.json
├── proto
│   └── client-registration.proto
├── README.md
├── sky-bell-firebase.json
├── src
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   ├── config
│   │   ├── bullMq.config.ts
│   │   ├── firebase.config.ts
│   │   ├── redis.config.ts
│   │   └── socket.config.ts
│   ├── infrsatructure
│   │   ├── database
│   │   │   ├── database.module.ts
│   │   │   └── database.provider.ts
│   │   ├── logger
│   │   │   ├── logger.interceptor.ts
│   │   │   ├── logger.module.ts
│   │   │   ├── logger.service.ts
│   │   │   └── transport.ts
│   │   ├── push
│   │   │   ├── push.module.ts
│   │   │   └── push.service.ts
│   │   ├── queue
│   │   │   ├── bullMq.module.ts
│   │   │   └── notification.processor.ts
│   │   ├── redis
│   │   │   ├── redis.module.ts
│   │   │   └── redis.service.ts
│   │   └── socket
│   │       ├── socket.adapter.ts
│   │       ├── socket.gateway.ts
│   │       └── socket.module.ts
│   ├── main.ts
│   ├── modules
│   │   └── client
│   │       ├── client.controller.ts
│   │       ├── client.grpc.ts
│   │       ├── client.module.ts
│   │       ├── client.service.ts
│   │       ├── dto
│   │       │   ├── client.dto.ts
│   │       │   └── schema
│   │       │       └── client.schema.ts
│   │       └── pipes
│   │           ├── client-registration-validation.pipe.ts
│   │           ├── fcm-token-request-validation.pipe.ts
│   │           ├── fcm-token-validation.pipe.ts
│   │           ├── index.ts
│   │           └── url-validation.pipe.ts
│   ├── shared
│   │   └── constants.ts
│   └── types
│       ├── client.type.ts
│       └── notification-job.type.ts
├── tsconfig.json
└── yarn.lock

```

## Architecture

The service follows a modular architecture based on NestJS:

- **Socket Adapter**: Manages CORS and WebSocket server creation
- **Socket Gateway**: Handles WebSocket authentication and event routing
- **Client Module**: Manages client registration and validation
- **Redis Service**: Handles connection tracking and pub/sub
- **Push Service**: Manages FCM push notifications
- **BullMQ Worker**: Processes notification jobs and handles all notification delivery
- **Logger Service**: Provides structured logging

### Notification Workflow

The core notification workflow is:

1. Client applications add notification jobs to the BullMQ queue
2. The BullMQ worker processes these jobs
3. The worker checks which users are online (connected via WebSocket)
4. For online users, notifications are delivered via Socket.IO in real-time
5. For offline users with registered FCM tokens, push notifications are sent via Firebase

This centralized approach ensures consistent delivery logic and proper handling of different notification channels.

## Installation

```bash
# Install dependencies
yarn install

# Run in development mode
yarn start:dev

# Build for production
yarn build

# Run in production mode
yarn start:prod
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Server
PORT=3000
GRPC_PORT=50051
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/skybell

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Firebase (optional for FCM)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="your-private-key"
```

## Integration Workflow

### Step 1: Register Your Application

First, you need to register your application with the notification service. This can be done through either the REST API or the gRPC service.

#### Option A: Register via REST API

```bash
curl -X POST http://localhost:3000/api/v1/clients \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "Your Application Name",
    "clientSecret": "your-secret-key-min-8-chars",
    "clientUrl": "https://your-application-domain.com",
    "description": "Description of your application",
    "cookieName": "your_auth_cookie_name",
    "isActive": true
  }'
```bash

The response will include a unique `clientId` that you'll use in all subsequent interactions:

```json
{
  "id": "6876dab283777a5d40cdc088",
  "message": "Client registered successfully"
}
```

#### Option B: Register via gRPC

You can also register your application using the gRPC service:

```javascript
// Using @grpc/grpc-js
const { ClientRegistrationClient } = require('./generated/proto/client-registration_grpc_pb');
const { RegisterClientRequest } = require('./generated/proto/client-registration_pb');

const client = new ClientRegistrationClient('localhost:50051', grpc.credentials.createInsecure());

const request = new RegisterClientRequest();
request.setAppName('Your Application Name');
request.setClientSecret('your-secret-key-min-8-chars');
request.setClientUrl('https://your-application-domain.com');
request.setDescription('Description of your application');
request.setCookieName('your_auth_cookie_name');
request.setIsActive(true);

client.registerClient(request, (err, response) => {
  if (err) {
    console.error('Error registering client:', err);
    return;
  }
  
  // Store the client ID for future use
  const clientId = response.getId();
  console.log('Client registered successfully with ID:', clientId);
});
```

### Step 2: Generate JWT Tokens

To authenticate your users with the notification service, you need to generate JWT tokens signed with your client secret:

```javascript
const jwt = require('jsonwebtoken');

function generateToken(clientId, userId) {
  return jwt.sign(
    {
      sub: userId,         // Required: User's unique identifier
      clientId: clientId,  // Required: Your client ID
      // Add any additional custom claims as needed
    },
    'your-client-secret',  // The secret key you provided during registration
    {
      expiresIn: '24h',    // Token expiration time
    }
  );
}

// Example usage
const token = generateToken('6876dab283777a5d40cdc088', 'user-123');
```

### Step 3: Connect to the WebSocket Server

Once you have your client ID and can generate tokens, you can connect to the WebSocket server:

```javascript
import { io } from 'socket.io-client';

// Client ID obtained during registration
const clientId = '6876dab283777a5d40cdc088';

// Create namespace based on client ID
const namespace = `/client-${clientId}`;

// Generate token for the current user
const token = generateToken(clientId, 'user-123');

// Optional FCM token for push notifications
const fcmToken = 'firebase-cloud-messaging-token';

// Connect to the WebSocket server with authentication
const socket = io(`http://localhost:3000${namespace}`, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  auth: { 
    clientId, 
    token,
    fcmToken  // Optional: Include FCM token for push notifications
  },
  query: { 
    clientId, 
    token,
    fcmToken  // Optional: Include FCM token for push notifications
  },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  withCredentials: true
});

// Event listeners
socket.on('connect', () => {
  console.log('Connected to notification server with socket ID:', socket.id);
});

socket.on('notification', (data) => {
  console.log('Notification received:', data);
  // Handle the notification in your application UI
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});

socket.on('disconnect', () => {
  console.log('Disconnected from notification server');
});
```

### Step 4: Register FCM Tokens (Optional)

If you want to receive push notifications when your users are offline, you should register their FCM tokens:

#### Option A: Via WebSocket Connection

The FCM token can be included in the connection parameters as shown above.

#### Option B: Via gRPC Service

```javascript
const { NotificationClient } = require('./generated/proto/client-registration_grpc_pb');
const { FCMTokenRequest } = require('./generated/proto/client-registration_pb');

const client = new NotificationClient('localhost:50051', grpc.credentials.createInsecure());

const request = new FCMTokenRequest();
request.setClientId('6876dab283777a5d40cdc088');
request.setUserId('user-123');
request.setFcmToken('firebase-cloud-messaging-token');

client.registerFCMToken(request, (err, response) => {
  if (err) {
    console.error('Error registering FCM token:', err);
    return;
  }
  
  console.log('FCM token registered successfully:', response.getSuccess());
});
```

### Step 5: Send Notifications

All notifications in SkyBell are processed through BullMQ jobs. This centralized approach ensures reliable delivery, proper queueing, and consistent handling of both WebSocket and push notifications.

To send notifications, you should use the BullMQ queue:

```javascript
const { Queue } = require('bullmq');

const notificationQueue = new Queue('notification_queue', {
  connection: {
    host: 'localhost',
    port: 6379
  }
});

// Add a notification job to the queue
await notificationQueue.add('notification-job', {
  clientId: '6876dab283777a5d40cdc088',  // Your client ID
  payload: {
    title: 'Daily Summary',
    body: 'Here is your daily activity summary',
    actionUrl: 'https://your-app.com/summary',
    imageUrl: 'https://your-app.com/summary-image.jpg',
    data: {
      summaryId: '12345'
    }
  },
  // Target specific users
  users: ['user-123', 'user-456']
});
```

The notification service's BullMQ worker will automatically:

1. Process the job
2. Determine if users are online (connected via WebSocket) or offline
3. Send real-time notifications via Socket.IO to online users
4. Send push notifications via Firebase Cloud Messaging (FCM) to offline users with registered tokens

> **Important**: Do not attempt to send push notifications directly via REST API or Socket.IO. The BullMQ worker is the only component that should process notification delivery to ensure proper handling of WebSocket and FCM notifications.

You can also use the REST API to add jobs to the notification queue (which will be processed by BullMQ):

```bash
curl -X POST http://localhost:3000/api/v1/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin-token" \
  -d '{
    "clientId": "6876dab283777a5d40cdc088",
    "payload": {
      "title": "System Notification",
      "body": "Important system update",
      "actionUrl": "https://your-app.com/updates",
      "imageUrl": "https://your-app.com/update-image.jpg",
      "data": {
        "updateId": "12345"
      }
    },
    "users": ["user-123", "user-456"]
  }'
```

### Step 6: Notification Delivery Workflow

When a notification job is received, the BullMQ worker follows this workflow:

1. **Validation**: Verify the client ID and user IDs are valid

2. **User Resolution**: Check which users are online (connected via WebSocket) and which are offline

3. **WebSocket Delivery**: For online users, deliver the notification in real-time via Socket.IO

4. **Push Notification**: For offline users with registered FCM tokens, send push notifications via Firebase Cloud Messaging

5. **Logging**: Log the delivery status and any errors for monitoring

This centralized processing ensures consistent delivery across all channels and proper handling of both real-time and asynchronous notifications.

## API Documentation

### REST API

After starting the server, access the Swagger documentation at:

```plaintext
http://localhost:3000/api/docs
```

### gRPC Services

The service provides the following gRPC endpoints:

- `ClientRegistrationService.RegisterClient` - Register a new client
- `NotificationService.RegisterFCMToken` - Register an FCM token for push notifications

### WebSocket Events

- `notification` - Sent to clients when a notification is available (client receives this event)
- `ping` - Sent from clients to check connection
- `pong` - Sent to clients in response to ping

> **Important**: The `notification-job` event is for internal use by the BullMQ worker only. Client applications should not attempt to emit this event directly. Instead, use the BullMQ queue or REST API to queue notification jobs.

## WebSocket Connection

Clients should connect to a namespace with the following format:

```plaintext
/client-{clientId}
```

Where `clientId` is the ID returned from client registration.

Authentication parameters should be provided in either the `auth` or `query` objects:

```javascript
{
  clientId: "your-client-id",
  token: "your-jwt-token",
  fcmToken: "optional-fcm-token"
}
```

## Complete Integration Workflow

For new developers looking to integrate with SkyBell, here's the complete step-by-step workflow:

1. **Register Your Application**
   - Use either the REST API or gRPC service to register your application
   - Store the returned `clientId` and keep your `clientSecret` secure
   - This step only needs to be done once per application

2. **Set Up Your Client**
   - Implement the JWT token generation using your `clientSecret`
   - Set up Socket.IO client with proper namespace format: `/client-{clientId}`
   - Include authentication parameters in connection request

3. **Connect Users**
   - When users log into your application, generate a JWT token for them
   - Connect to the WebSocket server with the token and optional FCM token
   - Handle connection events and notification reception

4. **Send Notifications**
   - Add notification jobs to the BullMQ queue using either:
     - Direct BullMQ queue integration in your application
     - The REST API to add jobs to the queue
   - Specify target users to receive the notification

5. **Process Notifications**
   - The BullMQ worker automatically processes notification jobs
   - Online users receive WebSocket notifications in real-time
   - Offline users receive push notifications via FCM (if registered)
   - All delivery logic is handled by the BullMQ worker

6. **Monitor and Scale**
   - Use the logs to monitor notification delivery
   - Scale the service horizontally for high-volume applications
   - Add additional Redis nodes for distributed deployments

This workflow allows you to quickly implement a robust notification system without building all the infrastructure yourself. SkyBell handles the complex parts like connection management, push notifications, and message queuing.

## Development

```bash
# Generate gRPC code
yarn proto:generate

# Run linting
yarn lint

# Run tests
yarn test

# Run tests with coverage
yarn test:cov
```

## Docker Deployment

SkyBell is fully containerized and ready for deployment with Docker:

### Using Docker Directly

```bash
# Build the Docker image
docker build -t skybell-notification-service .

# Run the container
docker run -p 3000:3000 -p 50051:50051 --name skybell \
  -v $(pwd)/logs:/app/logs \
  -e MONGODB_URI=mongodb://mongodb:27017/skybell \
  -e REDIS_HOST=redis \
  skybell-notification-service
```

### Using Docker Compose

You can deploy the entire stack using Docker Compose:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f notification-service

# Stop all services
docker-compose down
```

The docker-compose setup includes:

- Notification Service (NestJS backend)
- Test Client (Vite/React frontend)
- MongoDB database
- Redis for caching and message queue

### Scaling for Production

For production deployment, consider:

1. **Horizontal Scaling**: Run multiple notification service instances behind a load balancer
2. **Redis Cluster**: Set up a Redis cluster for high availability
3. **MongoDB Replica Set**: Configure MongoDB with replication for data redundancy
4. **Health Checks**: Implement health check endpoints and container restart policies
5. **Monitoring**: Add Prometheus and Grafana for metrics and monitoring

## Logging

The service logs to both console and files:

- `logs/app.log` - General application logs
- `logs/error.log` - Error logs

You can view logs in real-time with:

```bash
tail -f logs/app.log
```

## BullMQ Processing Details

SkyBell uses BullMQ for reliable background processing of notifications. Here's how the queue system works:

### Queue Structure

- **Queue Name**: `notification_queue`
- **Job Types**:
  - `notification-job`: Delivers notifications to users

### Job Processing Workflow

1. **Job Creation**
   - Jobs are added to the queue with required metadata (clientId, users, payload)
   - Priority can be set (where lower numbers indicate higher priority)
   - Optional delay for scheduled notifications

2. **Worker Processing**
   - `NotificationProcessor` picks up jobs from the queue
   - Workers validate the job data and prepare notifications for delivery
   - Workers use Redis to track user online/offline status

3. **Delivery Logic**
   - For online users: WebSocket delivery via Socket.IO
   - For offline users with FCM tokens: Push notification via Firebase Cloud Messaging
   - All delivery is handled by the BullMQ worker, not directly by client applications

4. **Retry Mechanism**
   - Failed jobs are automatically retried with exponential backoff
   - Maximum retry count is configurable
   - Dead-letter queue for persistent failures

### Example BullMQ Job

```javascript
// Job structure
{
  name: 'notification-job',
  data: {
    clientId: '6876dab283777a5d40cdc088',
    payload: {
      title: 'New Message',
      body: 'You have a new message from John',
      data: { messageId: '123', senderId: '456' }
    },
    users: ['user-123', 'user-456'],
    options: {
      priority: 2,
      attempts: 3,
      removeOnComplete: true
    }
  }
}
```

### Monitoring Jobs

The system provides endpoints to monitor job status:

```bash
# Get all active jobs
curl http://localhost:3000/api/v1/queues/notification_queue/jobs/active

# Get failed jobs
curl http://localhost:3000/api/v1/queues/notification_queue/jobs/failed

# Get job counts
curl http://localhost:3000/api/v1/queues/notification_queue/counts
```
