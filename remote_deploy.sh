#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Deployment Configuration ---
# The name of your main branch
MAIN_BRANCH="main"

# --- Deployment Steps ---

# 1. Pull the latest code from the Git repository
echo ">>> (1/4) Pulling latest code from Git..."
git checkout $MAIN_BRANCH
git pull origin $MAIN_BRANCH

# 2. Stop any running Docker containers to avoid conflicts
echo ">>> (2/4) Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# 3. Rebuild the Docker containers with the new code
echo ">>> (3/4) Building and starting new containers..."
docker-compose -f docker-compose.prod.yml up --build -d

# 4. Clean up any unused Docker assets
echo ">>> (4/4) Cleaning up unused Docker assets..."
docker image prune -f

echo "✅✅✅ Deployment to production completed successfully! ✅✅✅"