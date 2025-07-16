FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy app source
COPY . .

# Build the application
RUN yarn build

# Expose ports
EXPOSE 3000
EXPOSE 50051

# Start the service
CMD ["yarn", "start:prod"]
