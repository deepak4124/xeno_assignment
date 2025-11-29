#!/bin/sh

# Start NATS server in the background
echo "Starting NATS Server..."
nats-server -p 4222 &

# Wait a moment for NATS to initialize
sleep 2

# Start the Node.js application
echo "Starting Backend..."
npm start
