#!/bin/bash
# Enhanced Production Deployment Script for Fire Safety Scanner
# Includes backup, validation, and rollback capabilities

set -e

echo "🚀 Fire Safety Scanner - Production Deployment"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="production-backup-$TIMESTAMP"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}📦 Creating backup...${NC}"
echo "-------------------"

# Backup current environment
if [ -f ".env.prod" ]; then
    cp .env.prod "$BACKUP_DIR/.env.prod.$TIMESTAMP"
    echo "✅ Backed up .env.prod"
else
    echo "⚠️  No .env.prod found to backup"
fi

# Backup current .env if it exists
if [ -f ".env" ]; then
    cp .env "$BACKUP_DIR/.env.$TIMESTAMP"
    echo "✅ Backed up current .env"
fi

# Backup docker-compose configuration
cp docker-compose.prod.yml "$BACKUP_DIR/docker-compose.prod.yml.$TIMESTAMP"
echo "✅ Backed up docker-compose.prod.yml"

# Create full configuration backup
tar -czf "$BACKUP_DIR/$BACKUP_FILE.tar.gz" \
    .env.prod \
    docker-compose.prod.yml \
    docker/ \
    2>/dev/null || echo "⚠️  Some files may not exist for backup"

echo "✅ Created full backup: $BACKUP_DIR/$BACKUP_FILE.tar.gz"

echo ""
echo -e "${BLUE}🔧 Updating production configuration...${NC}"
echo "--------------------------------------"

# Validate .env.prod exists and has required keys
if [ ! -f ".env.prod" ]; then
    echo -e "${RED}❌ .env.prod file not found!${NC}"
    echo "Please ensure .env.prod exists with production configuration."
    exit 1
fi

# Check for required environment variables
REQUIRED_VARS=("OPENROUTER_API_KEY" "N8N_WEBHOOK_URL" "REACT_APP_BACKEND_URL")
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "$var" .env.prod; then
        echo -e "${RED}❌ Missing required variable: $var${NC}"
        exit 1
    fi
done

# Copy production environment
cp .env.prod .env
echo "✅ Updated .env with production configuration"

# Validate API keys are not placeholders
if grep -q "your_production_openrouter_api_key" .env; then
    echo -e "${RED}❌ OpenRouter API key is still a placeholder!${NC}"
    echo "Please update .env.prod with actual API keys."
    exit 1
fi

if grep -q "your_production_n8n_webhook_url" .env; then
    echo -e "${RED}❌ N8N webhook URL is still a placeholder!${NC}"
    echo "Please update .env.prod with actual webhook URL."
    exit 1
fi

echo "✅ Production API keys validated"

echo ""
echo -e "${BLUE}🐳 Deploying containers...${NC}"
echo "-----------------------------"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Pull latest images if needed
echo "📥 Pulling latest base images..."
docker-compose -f docker-compose.prod.yml pull mongo 2>/dev/null || true

# Build and start production containers
echo "🔨 Building and starting production containers..."
docker-compose -f docker-compose.prod.yml up -d --build

echo ""
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
echo "----------------------------------"

# Wait for services with progress indicator
for i in {1..30}; do
    echo -n "."
    sleep 1
done
echo ""

# Additional wait for full startup
sleep 10

echo ""
echo -e "${BLUE}🔍 Validating deployment...${NC}"
echo "-----------------------------"

# Run validation script
if [ -f "validate-deployment.sh" ]; then
    chmod +x validate-deployment.sh
    if ./validate-deployment.sh; then
        echo ""
        echo -e "${GREEN}✅ Deployment validation passed!${NC}"
    else
        echo ""
        echo -e "${RED}❌ Deployment validation failed!${NC}"
        echo ""
        echo "🔄 Rolling back to previous state..."
        
        # Rollback
        if [ -f "$BACKUP_DIR/.env.$TIMESTAMP" ]; then
            cp "$BACKUP_DIR/.env.$TIMESTAMP" .env
            echo "✅ Restored previous .env"
        fi
        
        docker-compose -f docker-compose.prod.yml down
        echo "❌ Deployment failed and rolled back"
        exit 1
    fi
else
    echo "⚠️  Validation script not found, skipping validation"
fi

echo ""
echo -e "${BLUE}📊 Deployment Summary${NC}"
echo "===================="

# Show container status
echo "🐳 Container Status:"
docker ps --filter "name=fire-safety-scanner" --format "   {{.Names}}: {{.Status}}"

# Show access information
echo ""
echo "🌐 Access Information:"
echo "   Production URL: https://scanner.hales.ai"
echo "   Local Access:   http://localhost:80"
echo "   Backend API:    http://localhost:8001"
echo "   MongoDB:        localhost:27017"

echo ""
echo "📁 Backup Information:"
echo "   Backup Location: $BACKUP_DIR/$BACKUP_FILE.tar.gz"
echo "   Restore Command: tar -xzf $BACKUP_DIR/$BACKUP_FILE.tar.gz"

echo ""
echo -e "${GREEN}🎉 Production deployment completed successfully!${NC}"
echo ""
echo "🔍 Next Steps:"
echo "   1. Test the website: https://scanner.hales.ai"
echo "   2. Test camera functionality"
echo "   3. Verify API endpoints are working"
echo "   4. Monitor logs: docker-compose -f docker-compose.prod.yml logs -f"

echo ""
echo "🆘 If issues occur:"
echo "   1. Check logs: docker-compose -f docker-compose.prod.yml logs"
echo "   2. Run validation: ./validate-deployment.sh"
echo "   3. Rollback if needed: tar -xzf $BACKUP_DIR/$BACKUP_FILE.tar.gz"

echo ""
echo "✅ Deployment complete!"