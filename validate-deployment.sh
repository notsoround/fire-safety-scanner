#!/bin/bash
# Deployment Validation Script for Fire Safety Scanner
# Tests system health and functionality

set -e

echo "🔍 Fire Safety Scanner - Deployment Validation"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "📊 Testing Container Health..."
echo "------------------------------"

# Test container health
CONTAINER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ 2>/dev/null || echo "000")
if [ "$CONTAINER_STATUS" = "200" ]; then
    print_status 0 "Container responding (HTTP 200)"
else
    print_status 1 "Container not responding (HTTP $CONTAINER_STATUS)"
fi

# Test if container is actually running
RUNNING_CONTAINERS=$(docker ps --filter "name=fire-safety-scanner" --format "{{.Names}}" | wc -l)
if [ "$RUNNING_CONTAINERS" -gt 0 ]; then
    print_status 0 "Docker containers running ($RUNNING_CONTAINERS active)"
    echo "   Active containers:"
    docker ps --filter "name=fire-safety-scanner" --format "   - {{.Names}} ({{.Status}})"
else
    print_status 1 "No Fire Safety Scanner containers running"
fi

echo ""
echo "🔌 Testing Backend API..."
echo "-------------------------"

# Test backend API health
API_RESPONSE=$(curl -s http://localhost:8001/api/health 2>/dev/null || echo "ERROR")
if [[ "$API_RESPONSE" == *"healthy"* ]]; then
    print_status 0 "Backend API healthy"
elif [[ "$API_RESPONSE" == *"status"* ]]; then
    print_status 0 "Backend API responding"
else
    print_status 1 "Backend API not responding ($API_RESPONSE)"
fi

# Test backend port accessibility
if nc -z localhost 8001 2>/dev/null; then
    print_status 0 "Backend port 8001 accessible"
else
    print_status 1 "Backend port 8001 not accessible"
fi

echo ""
echo "🗄️  Testing Database Connection..."
echo "----------------------------------"

# Test MongoDB connection
if nc -z localhost 27017 2>/dev/null; then
    print_status 0 "MongoDB port 27017 accessible"
else
    print_status 1 "MongoDB port 27017 not accessible"
fi

# Check if MongoDB container is running
MONGO_RUNNING=$(docker ps --filter "name=mongo" --format "{{.Names}}" | wc -l)
if [ "$MONGO_RUNNING" -gt 0 ]; then
    print_status 0 "MongoDB container running"
else
    print_status 1 "MongoDB container not running"
fi

echo ""
echo "🌐 Testing Production Domain (if applicable)..."
echo "-----------------------------------------------"

# Check if we're in production mode
if [ -f ".env" ] && grep -q "scanner.hales.ai" .env; then
    echo "Production mode detected, testing domain..."
    
    # Test production domain
    PROD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://scanner.hales.ai/ 2>/dev/null || echo "000")
    if [ "$PROD_STATUS" = "200" ]; then
        print_status 0 "Production domain responding (HTTP 200)"
    else
        print_status 1 "Production domain not responding (HTTP $PROD_STATUS)"
    fi
    
    # Test production API
    PROD_API=$(curl -s https://scanner.hales.ai/api/health 2>/dev/null || echo "ERROR")
    if [[ "$PROD_API" == *"healthy"* ]] || [[ "$PROD_API" == *"status"* ]]; then
        print_status 0 "Production API responding"
    else
        print_status 1 "Production API not responding"
    fi
    
else
    print_warning "Development mode detected, skipping production domain tests"
fi

echo ""
echo "📷 Testing Camera Feature..."
echo "----------------------------"

# Check if camera components exist
if [ -f "frontend/src/FireExtinguisherCamera.js" ]; then
    print_status 0 "FireExtinguisherCamera component exists"
else
    print_status 1 "FireExtinguisherCamera component missing"
fi

if [ -f "frontend/src/CameraTest.js" ]; then
    print_status 0 "CameraTest component exists"
else
    print_status 1 "CameraTest component missing"
fi

# Check if camera CSS exists
if grep -q "camera-preview-container" frontend/src/App.css 2>/dev/null; then
    print_status 0 "Camera CSS styling present"
else
    print_status 1 "Camera CSS styling missing"
fi

echo ""
echo "🔧 Environment Configuration..."
echo "------------------------------"

# Check environment file
if [ -f ".env" ]; then
    print_status 0 ".env file exists"
    
    # Check for required variables
    if grep -q "OPENROUTER_API_KEY" .env; then
        print_status 0 "OpenRouter API key configured"
    else
        print_status 1 "OpenRouter API key missing"
    fi
    
    if grep -q "N8N_WEBHOOK_URL" .env; then
        print_status 0 "N8N webhook URL configured"
    else
        print_status 1 "N8N webhook URL missing"
    fi
    
    if grep -q "REACT_APP_BACKEND_URL" .env; then
        BACKEND_URL=$(grep "REACT_APP_BACKEND_URL" .env | cut -d'=' -f2 | tr -d '"')
        print_status 0 "Backend URL configured: $BACKEND_URL"
    else
        print_status 1 "Backend URL missing"
    fi
    
else
    print_status 1 ".env file missing"
fi

echo ""
echo "📋 Validation Summary"
echo "===================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Deployment is healthy.${NC}"
    echo ""
    echo "✅ System Status: HEALTHY"
    echo "✅ Ready for use"
    
    # Show access URLs
    echo ""
    echo "🌐 Access URLs:"
    if grep -q "localhost" .env 2>/dev/null; then
        echo "   Frontend: http://localhost:8080"
        echo "   Backend:  http://localhost:8001"
    fi
    if grep -q "scanner.hales.ai" .env 2>/dev/null; then
        echo "   Production: https://scanner.hales.ai"
    fi
    
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) found. Deployment needs attention.${NC}"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "   1. Check container logs: docker-compose logs -f"
    echo "   2. Restart containers: ./switch-env.sh [dev|prod]"
    echo "   3. Verify environment configuration"
    echo "   4. Check network connectivity"
    
    exit 1
fi