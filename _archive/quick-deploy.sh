#!/bin/bash

# Fire Safety Scanner - Quick Deploy Script
# This script helps you deploy the Fire Safety Scanner on Digital Ocean

set -e

echo "🔥 Fire Safety Scanner - Quick Deploy Script"
echo "============================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. Please log out and back in, then re-run this script."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Installing..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed."
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo ""
    echo "🔑 IMPORTANT: Edit the .env file with your API keys:"
    echo "   - OPENROUTER_API_KEY (get from https://openrouter.ai/keys)"
    echo "   - N8N_WEBHOOK_URL (optional)"
    echo ""
    read -p "Press Enter when you've updated the .env file with your API keys..."
fi

# Validate required environment variables
echo "🔍 Validating environment variables..."
source .env

if [ -z "$OPENROUTER_API_KEY" ] || [ "$OPENROUTER_API_KEY" = "your_openrouter_api_key_here" ]; then
    echo "❌ OPENROUTER_API_KEY not set. Please update your .env file."
    exit 1
fi


echo "✅ Environment variables validated."

# Build and start the application
echo "🚀 Building and starting Fire Safety Scanner..."
docker-compose up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Display success message
echo ""
echo "🎉 Fire Safety Scanner deployed successfully!"
echo ""
echo "📋 Service Information:"
echo "   • Application URL: http://$(curl -s ifconfig.me || echo 'localhost')"
echo "   • Backend API: http://$(curl -s ifconfig.me || echo 'localhost'):8001/api"
echo "   • Database: MongoDB running on port 27017"
echo ""
echo "🔧 Management Commands:"
echo "   • View logs: docker-compose logs -f"
echo "   • Stop services: docker-compose down"
echo "   • Restart services: docker-compose restart"
echo ""
echo "📚 For detailed documentation, see DEPLOYMENT.md"
echo ""
echo "✅ Your Fire Safety Scanner is ready to use!"