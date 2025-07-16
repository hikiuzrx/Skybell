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

```bash
# Build the Docker image
docker build -t notification-service .

# Run the container
docker run -p 3000:3000 -p 50051:50051 notification-service
```

## Logging

The service logs to both console and files:

- `logs/app.log` - General application logs
- `logs/error.log` - Error logs

You can view logs in real-time with:

```bash
tail -f logs/app.log
```
