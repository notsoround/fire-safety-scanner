#!/bin/bash
# Environment Switching Script for Fire Safety Scanner
# Usage: ./switch-env.sh [dev|prod]

set -e

ENVIRONMENT=$1

if [ "$ENVIRONMENT" = "dev" ]; then
    echo "🔧 Switching to DEVELOPMENT environment..."
    
    # Copy development environment
    cp .env.example .env
    echo "✅ Copied .env.example to .env"
    
    # Stop any running containers
    echo "🛑 Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    docker-compose down 2>/dev/null || true
    
    # Start development environment
    echo "🚀 Starting development environment..."
    docker-compose up -d --build
    
    # Wait for services to start
    echo "⏳ Waiting for services to start..."
    sleep 15
    
    echo ""
    echo "✅ Development environment active!"
    echo "🌐 Frontend: http://localhost:8080"
    echo "🔌 Backend API: http://localhost:8001"
    echo "📊 MongoDB: localhost:27017"
    
elif [ "$ENVIRONMENT" = "prod" ]; then
    echo "🚀 Switching to PRODUCTION environment..."
    
    # Copy production environment
    cp .env.prod .env
    echo "✅ Copied .env.prod to .env"
    
    # Stop any running containers
    echo "🛑 Stopping existing containers..."
    docker-compose down 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    # Start production environment
    echo "🐳 Starting production environment..."
    docker-compose -f docker-compose.prod.yml up -d --build
    
    # Wait for services to start
    echo "⏳ Waiting for services to start..."
    sleep 20
    
    echo ""
    echo "✅ Production environment active!"
    echo "🌐 Frontend: https://scanner.hales.ai (or http://localhost:80)"
    echo "🔌 Backend API: http://localhost:8001"
    echo "📊 MongoDB: localhost:27017"
    
elif [ "$ENVIRONMENT" = "status" ]; then
    echo "📊 Current Environment Status:"
    echo ""
    
    # Check which .env is active
    if [ -f ".env" ]; then
        if grep -q "localhost:8001" .env; then
            echo "🔧 Current Mode: DEVELOPMENT"
            echo "📁 Environment File: .env (copied from .env.example)"
        elif grep -q "scanner.hales.ai" .env; then
            echo "🚀 Current Mode: PRODUCTION"
            echo "📁 Environment File: .env (copied from .env.prod)"
        else
            echo "❓ Current Mode: UNKNOWN"
        fi
    else
        echo "❌ No .env file found"
    fi
    
    echo ""
    echo "🐳 Running Containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
else
    echo "🔥 Fire Safety Scanner - Environment Switcher"
    echo ""
    echo "Usage: ./switch-env.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev     - Switch to development environment"
    echo "  prod    - Switch to production environment"
    echo "  status  - Show current environment status"
    echo ""
    echo "Examples:"
    echo "  ./switch-env.sh dev     # Start local development"
    echo "  ./switch-env.sh prod    # Start production mode"
    echo "  ./switch-env.sh status  # Check current status"
    echo ""
    exit 1
fi