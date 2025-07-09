#!/bin/bash

ENV=${1:-production}

echo "Deploying Livestream system in $ENV mode..."

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Pull latest images if needed
# echo "Pulling latest images..."
# docker-compose pull

# Start containers
echo "Starting containers..."
docker-compose -f docker-compose.yml up -d

# Run migrations if needed
echo "Running database migrations..."
docker-compose exec server node migrations/migrate.js

echo "Deployment completed!"