#!/bin/bash

# One-command fix for Fire Safety Scanner redirect loop
# Run this on your DigitalOcean droplet

echo "🔥 Deploying Fire Safety Scanner redirect fix..."

# Navigate to project directory
cd ~/projects/fire-safety-scanner || { echo "❌ Project directory not found"; exit 1; }

# Backup current config
cp docker-compose.prod.yml docker-compose.prod.yml.backup

# Fix the nginx configuration
sed -i 's|./docker/nginx-ssl.conf:/etc/nginx/sites-available/default|./docker/nginx.conf:/etc/nginx/sites-available/default|g' docker-compose.prod.yml

echo "✅ Fixed docker-compose.prod.yml nginx configuration"

# Stop containers
echo "⏹️  Stopping containers..."
docker-compose -f docker-compose.prod.yml down

# Rebuild and start
echo "🚀 Rebuilding and starting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for startup
echo "⏳ Waiting 30 seconds for services to start..."
sleep 30

# Test the fix
echo "🧪 Testing the fix..."
echo ""
echo "Testing container (should return 200, not 301):"
curl -I http://localhost:8080/ | head -1

echo ""
echo "Testing backend API:"
curl -s http://localhost:8001/api/health

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "✅ Test your website: https://scanner.hales.ai/"
echo "✅ Should now load without redirect loop!"