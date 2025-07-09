#!/bin/bash

# Build all Docker images
echo "Building Docker images..."
docker-compose -f docker-compose.yml build

# Install client dependencies if not in Docker
echo "Installing client dependencies..."
cd client && npm install && cd ..

# Install server dependencies if not in Docker
echo "Installing server dependencies..."
cd server && npm install && cd ..

# Install streaming server dependencies if not in Docker
echo "Installing streaming server dependencies..."
cd streaming-server && npm install && cd ..

echo "Build completed successfully!"