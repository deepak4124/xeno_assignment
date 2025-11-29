#!/bin/sh

# Start NATS server in the background with JetStream enabled
# Bind to localhost only to prevent external health checks from causing "Client parser ERROR"
echo "Starting NATS Server..."
nats-server -p 4222 -a 127.0.0.1 -js &

# Wait a moment for NATS to initialize
sleep 2

# Ensure database schema is up to date
echo "Pushing database schema..."
npx prisma db push

# Start the Node.js application
echo "Starting Backend..."
npm start
