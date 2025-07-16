# Notification Service

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
