FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy app source
COPY . .

# Generate proto files if needed
RUN yarn proto:generate || true

# Build the application
RUN yarn build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/proto ./proto
COPY --from=builder /app/sky-bell-firebase.json ./sky-bell-firebase.json

# Create log directory
RUN mkdir -p logs && \
    chown -R node:node /app

# Use non-root user
USER node

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV GRPC_PORT=50051

# Expose ports
EXPOSE 3000
EXPOSE 50051

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Start the service
CMD ["yarn", "start:prod"]
