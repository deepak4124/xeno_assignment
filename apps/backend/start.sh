#!/bin/sh

# Start NATS server in the background with JetStream enabled
echo "Starting NATS Server..."
nats-server -p 4222 -js &

# Wait a moment for NATS to initialize
sleep 2

# Ensure database schema is up to date
echo "Pushing database schema..."
npx prisma db push

# Start the Node.js application
echo "Starting Backend..."
npm start
