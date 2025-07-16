<p align="center">
  <img src="https://raw.githubusercontent.com/user/skybell-notification/main/assets/skybell-logo.png" alt="SkyBell Logo" width="400" />
</p>

<p align="center">
  <strong>Plug-and-Play Notification Service</strong>
</p>

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" alt="NestJS" height="40" />
  <img src="https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg" alt="TypeScript" height="40" />
  <img src="https://grpc.io/img/logos/grpc-logo.png" alt="gRPC" height="40" />
  <img src="https://redis.io/images/logos/redis-icon-full-color.svg" alt="Redis" height="40" />
</p>

# SkyBell Notification Service

A scalable microservice for real-time notifications using NestJS, Socket.IO, gRPC, and Redis.

## Features

- WebSocket server for real-time client communication
- Dynamic namespaces for client segregation
- JWT-based authentication
- gRPC services for client registration
- FCM integration for push notifications
- Redis for distributed connection management
- MongoDB for client storage
- BullMQ for background job processing

## Project Structure

```
notification-service/
├── bun.lock
├── Dockerfile
├── index.ts
├── logs
│   ├── app.log
│   └── error.log
├── nest-cli.json
├── package.json
├── proto
│   └── client-registration.proto
├── README.md
├── sky-bell-firebase.json
├── src
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   ├── config
│   │   ├── bullMq.config.ts
│   │   ├── firebase.config.ts
│   │   ├── redis.config.ts
│   │   └── socket.config.ts
│   ├── generated
│   │   └── proto
│   │       ├── client-registration_grpc_pb.d.ts
│   │       ├── client-registration_grpc_pb.js
│   │       ├── client-registration_pb.d.ts
│   │       └── client-registration_pb.js
│   ├── infrsatructure
│   │   ├── database
│   │   │   ├── database.module.ts
│   │   │   └── database.provider.ts
│   │   ├── logger
│   │   │   ├── logger.interceptor.ts
│   │   │   ├── logger.module.ts
│   │   │   ├── logger.service.ts
│   │   │   └── transport.ts
│   │   ├── push
│   │   │   ├── push.module.ts
│   │   │   └── push.service.ts
│   │   ├── queue
│   │   │   ├── bullMq.module.ts
│   │   │   └── notification.processor.ts
│   │   ├── redis
│   │   │   ├── redis.module.ts
│   │   │   └── redis.service.ts
│   │   └── socket
│   │       ├── socket.adapter.ts
│   │       ├── socket.gateway.ts
│   │       └── socket.module.ts
│   ├── main.ts
│   ├── modules
│   │   └── client
│   │       ├── client.controller.ts
│   │       ├── client.grpc.ts
│   │       ├── client.module.ts
│   │       ├── client.service.ts
│   │       ├── dto
│   │       │   ├── client.dto.ts
│   │       │   └── schema
│   │       │       └── client.schema.ts
│   │       └── pipes
│   │           ├── client-registration-validation.pipe.ts
│   │           ├── fcm-token-request-validation.pipe.ts
│   │           ├── fcm-token-validation.pipe.ts
│   │           ├── index.ts
│   │           └── url-validation.pipe.ts
│   ├── shared
│   │   └── constants.ts
│   └── types
│       ├── client.type.ts
│       └── notification-job.type.ts
├── tsconfig.json
└── yarn.lock
```

## Architecture

The service follows a modular architecture based on NestJS:

- **Socket Adapter**: Manages CORS and WebSocket server creation
- **Socket Gateway**: Handles authentication and event routing
- **Client Module**: Manages client registration and validation
- **Redis Service**: Handles connection tracking and pub/sub
- **Push Service**: Manages FCM push notifications
- **Logger Service**: Provides structured logging

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

```
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
```

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

You can send notifications using multiple methods:

#### Option A: Via WebSocket Event (Real-time)

```javascript
// Send a notification to specific users or sockets
socket.emit('notification-job', {
  payload: {
    title: 'New Message',
    body: 'You have received a new message',
    actionUrl: 'https://your-app.com/messages',
    imageUrl: 'https://your-app.com/notification-image.jpg',
    data: {
      messageId: '12345',
      senderId: 'user-456'
    }
  },
  // Optional: List of specific socket IDs to target
  sockets: ['target-socket-id-1', 'target-socket-id-2'],
  // Optional: List of user IDs to target
  users: ['user-789', 'user-101']
});
```

#### Option B: Via BullMQ (Background Processing)

For high-volume or scheduled notifications, use the BullMQ queue:

```javascript
const { Queue } = require('bullmq');

const notificationQueue = new Queue('notifications', {
  connection: {
    host: 'localhost',
    port: 6379
  }
});

// Add a notification job to the queue
await notificationQueue.add('notification-job', {
  clientId: '6876dab283777a5d40cdc088',
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

#### Option C: Via REST API

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

### Step 6: Process Notification Delivery

When a notification is sent, the service follows this workflow:

1. **Validation**: Verify the client ID and user permissions
2. **User Resolution**: Look up the online status of targeted users
3. **WebSocket Delivery**: For online users, send the notification via WebSocket
4. **Push Notification**: For offline users with registered FCM tokens, send push notifications
5. **Storage**: Store notifications for retrieval when users reconnect (configurable)

## API Documentation

### REST API

After starting the server, access the Swagger documentation at:

```
http://localhost:3000/api/docs
```

### gRPC Services

The service provides the following gRPC endpoints:

- `ClientRegistrationService.RegisterClient` - Register a new client
- `NotificationService.RegisterFCMToken` - Register an FCM token for push notifications

### WebSocket Events

- `notification` - Sent to clients when a notification is available
- `notification-job` - Received from clients to trigger notifications to other clients
- `ping` - Received from clients to check connection
- `pong` - Sent to clients in response to ping

## WebSocket Connection

Clients should connect to a namespace with the following format:

```
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

## Workflow for Integrating with the Notification Service

The notification service uses a hybrid approach for client integration. Follow these steps to integrate your application:

### 1. Client Registration

First, register your client application using either the REST API or gRPC service:

#### Using REST API

```bash
curl -X POST http://localhost:3000/api/v1/clients \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "Your App Name",
    "clientSecret": "your-secret-key-at-least-8-chars",
    "clientUrl": "https://your-app-domain.com",
    "description": "Description of your application",
    "cookieName": "your_auth_cookie_name"
  }'
```

#### Using gRPC

```javascript
// Example with grpc-js
const client = new ClientRegistrationServiceClient('localhost:50051');
client.RegisterClient({
  appName: "Your App Name",
  clientSecret: "your-secret-key-at-least-8-chars",
  clientUrl: "https://your-app-domain.com",
  description: "Description of your application",
  cookieName: "your_auth_cookie_name"
}, (err, response) => {
  console.log('Client ID:', response.id);
});
```

The server will return a unique `clientId` that you'll use for all subsequent operations.

### 2. WebSocket Connection

After registration, clients can connect to the WebSocket server:

```javascript
const socket = io(`http://your-server:3000/client-${clientId}`, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  auth: {
    clientId: 'your-client-id',
    token: 'your-jwt-token-signed-with-client-secret',
    fcmToken: 'optional-fcm-token-for-push-notifications'
  }
});
```

#### JWT Token Generation

```javascript
// Using jsonwebtoken library
const jwt = require('jsonwebtoken');

const token = jwt.sign({
  sub: 'user-id',
  userId: 'user-id',
  clientId: 'your-client-id'
}, 'your-client-secret', {
  expiresIn: '24h'
});
```

### 3. Sending Notification Jobs

You can send notifications using three methods:

#### A. Direct WebSocket Event (Real-time)

```javascript
socket.emit('notification-job', {
  payload: {
    title: 'Notification Title',
    body: 'Notification Body',
    data: { customField: 'value' }
  },
  sockets: ['target-socket-id-1', 'target-socket-id-2']  // Optional: specific sockets
});
```

#### B. REST API (Background Processing via BullMQ)

```bash
curl -X POST http://localhost:3000/api/v1/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-token" \
  -d '{
    "clientId": "your-client-id",
    "users": ["user1", "user2"],
    "payload": {
      "title": "Notification Title",
      "body": "Notification Body",
      "actionUrl": "https://example.com/action",
      "imageUrl": "https://example.com/image.jpg",
      "data": { "customField": "value" }
    }
  }'
```

#### C. Programmatic Queue (Node.js Client)

```javascript
// Using bullmq
const { Queue } = require('bullmq');

const notificationQueue = new Queue('notifications', {
  connection: {
    host: 'your-redis-host',
    port: 6379
  }
});

await notificationQueue.add('notification-job', {
  clientId: 'your-client-id',
  users: ['user1', 'user2'],
  payload: {
    title: 'Notification Title',
    body: 'Notification Body',
    actionUrl: 'https://example.com/action',
    imageUrl: 'https://example.com/image.jpg',
    data: { customField: 'value' }
  }
});
```

### 4. Processing Flow

Here's what happens when you submit a notification job:

1. **Job Queuing**: The job is added to the BullMQ queue
2. **Worker Processing**: The notification processor picks up the job
3. **User Resolution**: The system looks up connected sockets for the targeted users
4. **Delivery Methods**:
   - **WebSocket**: Sends real-time notifications to connected clients
   - **FCM (Firebase Cloud Messaging)**: Sends push notifications to registered devices
   - **Fallback Storage**: Stores notifications for offline users in Redis

### 5. Receiving Notifications

Clients receive notifications through the WebSocket connection:

```javascript
socket.on('notification', (data) => {
  console.log('Received notification:', data);
  // Handle the notification in your UI
});
```

### 6. FCM Token Registration (Optional)

For push notifications to mobile devices or browsers, register FCM tokens:

#### Using gRPC Service

```javascript
client.RegisterFCMToken({
  userId: 'user-id',
  clientId: 'your-client-id',
  fcmToken: 'fcm-token-from-firebase'
}, (err, response) => {
  console.log('FCM token registered:', response.success);
});
```

#### Using WebSocket Connection

Simply include the FCM token in your connection parameters:

```javascript
const socket = io(`http://your-server:3000/client-${clientId}`, {
  auth: {
    clientId: 'your-client-id',
    token: 'your-jwt-token',
    fcmToken: 'fcm-token-from-firebase'
  }
});
```

### 7. Testing WebSocket Connections

You can test your WebSocket connection using various tools:

#### Using the Test Client

The repository includes a test client (`notification-test-client-vite`) that demonstrates how to connect to the WebSocket server and handle events.

#### Using Postman

Postman supports WebSocket testing:

1. Create a new WebSocket request
2. Use the URL: `ws://localhost:3000/client-YOUR_CLIENT_ID?EIO=4&transport=websocket&clientId=YOUR_CLIENT_ID&token=YOUR_JWT_TOKEN`
3. Send and receive messages

#### Using Command-Line Tools

You can use `wscat` to test WebSocket connections:

```bash
# Install wscat
npm install -g wscat

# Connect to the WebSocket server
wscat -c "ws://localhost:3000/client-YOUR_CLIENT_ID?EIO=4&transport=websocket&clientId=YOUR_CLIENT_ID&token=YOUR_JWT_TOKEN"

# Send a test message
> {"event":"notification-job","data":{"payload":{"message":"Test"},"sockets":[]}}
```

#### Using the Test Script

The repository includes a test script (`test-socket.js`) that demonstrates how to connect and test the WebSocket server:

```bash
# Run the test script
node test-socket.js
```

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
