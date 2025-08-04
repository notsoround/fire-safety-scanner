#!/bin/bash
set -e

# Pull the latest code from the main branch
git pull origin main

# Build and restart the production containers
docker-compose -f docker-compose.prod.yml up --build -d

echo "Deployment completed successfully!"