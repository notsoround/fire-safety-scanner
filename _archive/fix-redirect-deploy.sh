#!/bin/bash

# Fire Safety Scanner - Fix Redirect Loop Deployment Script
# This script fixes the infinite redirect loop by updating the nginx configuration

set -e

echo "🔥 Fire Safety Scanner - Fix Redirect Loop"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ docker-compose.prod.yml not found. Please run this from the fire-safety-scanner directory."
    exit 1
fi

echo "🔍 Current status check..."

# Check if containers are running
echo "📋 Checking current containers..."
docker ps | grep fire-safety || echo "No fire-safety containers currently running"

# Show current nginx config being used
echo "🔧 Current nginx configuration in docker-compose.prod.yml:"
grep "nginx.*conf" docker-compose.prod.yml || echo "No nginx config found"

echo ""
echo "🚀 Applying fix for redirect loop..."

# Stop existing containers
echo "⏹️  Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || echo "No containers to stop"

# Remove any existing containers/images to force rebuild
echo "🧹 Cleaning up old containers..."
docker system prune -f

# Build and start with the fixed configuration
echo "🔨 Building with fixed nginx configuration..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Test the fix
echo "🧪 Testing the fix..."
echo ""
echo "Testing Docker container nginx (should return HTML, not 301):"
curl -I http://localhost:8080/ || echo "❌ Container not responding on port 8080"

echo ""
echo "Testing backend API (should return health status):"
curl -s http://localhost:8001/api/health || echo "❌ Backend not responding on port 8001"

# Show running containers
echo ""
echo "📋 Current running containers:"
docker ps

echo ""
echo "🎉 Fix deployment complete!"
echo ""
echo "🔍 Next steps to verify:"
echo "   1. Test: curl http://localhost:8080/ (should return HTML)"
echo "   2. Test: curl https://scanner.hales.ai/ (should load frontend)"
echo "   3. Check logs: docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "✅ The redirect loop should now be fixed!"