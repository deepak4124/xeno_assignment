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

# Copy backend source code
COPY apps/backend apps/backend

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Build the backend
RUN npm run build

# Expose the port
EXPOSE 4000

# Start the application
CMD ["npm", "start"]
