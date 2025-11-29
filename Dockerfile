# Use Node.js LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy backend package files
COPY apps/backend/package.json apps/backend/

# Install dependencies
RUN npm install

# Install NATS Server (Embedded for single-container deployment)
RUN apk add --no-cache nats-server

# Copy backend source code
COPY apps/backend apps/backend

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Build the backend
RUN npm run build

# Make the start script executable
RUN chmod +x start.sh

# Expose the port
EXPOSE 4000

# Start the application using the wrapper script
CMD ["./start.sh"]
