# 🔧 Environment Management & Deployment Plan

**Project:** Fire Safety Scanner  
**Date:** 2025-08-04  
**Status:** Ready for Implementation

## 🎯 Objective

Set up proper environment management for seamless local development and production deployment, including:
- Updated production API keys
- Fixed SSL configuration
- Automated environment switching
- Deployment validation procedures

## 📋 Current State Analysis

### ✅ Working Components
- Local development environment with Docker
- Production infrastructure on Digital Ocean droplet (scanner.hales.ai)
- Camera functionality (95% complete)
- Basic environment file structure

### 🔧 Issues to Address
1. **Production API Keys** - `.env.prod` has placeholder values
2. **SSL Configuration** - `nginx-ssl.conf` has placeholder domain
3. **Environment Switching** - No automation for dev/prod transitions
4. **Deployment Validation** - No systematic testing procedures

## 🚀 Implementation Plan

### Phase 1: Update Production Configuration

#### 1.1 Update `.env.prod` with Real API Keys
```bash
# Current placeholders to replace:
OPENROUTER_API_KEY="your_production_openrouter_api_key"
N8N_WEBHOOK_URL="your_production_n8n_webhook_url"

# Replace with provided values:
OPENROUTER_API_KEY="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"
N8N_WEBHOOK_URL="https://automate.hales.ai/webhook/416c17d3-05ef-4589-ac7b-7b3b9b47814b"
```

#### 1.2 Fix SSL Configuration in `nginx-ssl.conf`
```nginx
# Current placeholder:
ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

# Replace with:
ssl_certificate /etc/letsencrypt/live/scanner.hales.ai/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/scanner.hales.ai/privkey.pem;
```

### Phase 2: Create Environment Management Scripts

#### 2.1 Environment Switching Script (`switch-env.sh`)
```bash
#!/bin/bash
# Script to switch between development and production environments

ENVIRONMENT=$1

if [ "$ENVIRONMENT" = "dev" ]; then
    echo "🔧 Switching to DEVELOPMENT environment..."
    cp .env.example .env
    docker-compose down
    docker-compose up -d --build
    echo "✅ Development environment active on http://localhost:8080"
    
elif [ "$ENVIRONMENT" = "prod" ]; then
    echo "🚀 Switching to PRODUCTION environment..."
    cp .env.prod .env
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml up -d --build
    echo "✅ Production environment active"
    
else
    echo "❌ Usage: ./switch-env.sh [dev|prod]"
    exit 1
fi
```

#### 2.2 Deployment Validation Script (`validate-deployment.sh`)
```bash
#!/bin/bash
# Script to validate deployment health

echo "🔍 Validating deployment..."

# Test container health
echo "Testing container health..."
CONTAINER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/)
if [ "$CONTAINER_STATUS" = "200" ]; then
    echo "✅ Container responding (HTTP 200)"
else
    echo "❌ Container not responding (HTTP $CONTAINER_STATUS)"
fi

# Test backend API
echo "Testing backend API..."
API_STATUS=$(curl -s http://localhost:8001/api/health)
if [[ "$API_STATUS" == *"healthy"* ]]; then
    echo "✅ Backend API healthy"
else
    echo "❌ Backend API not responding"
fi

# Test production domain (if in prod mode)
if [ -f ".env" ] && grep -q "scanner.hales.ai" .env; then
    echo "Testing production domain..."
    PROD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://scanner.hales.ai/)
    if [ "$PROD_STATUS" = "200" ]; then
        echo "✅ Production domain responding (HTTP 200)"
    else
        echo "❌ Production domain not responding (HTTP $PROD_STATUS)"
    fi
fi

echo "🏁 Validation complete"
```

### Phase 3: Enhanced Deployment Procedures

#### 3.1 Pre-deployment Checklist
- [ ] Environment variables validated
- [ ] SSL certificates current
- [ ] Database backup completed
- [ ] Camera functionality tested locally
- [ ] API endpoints responding

#### 3.2 Production Deployment Script (`deploy-production.sh`)
```bash
#!/bin/bash
# Enhanced production deployment with validation

set -e

echo "🚀 Starting production deployment..."

# Backup current environment
echo "📦 Creating backup..."
cp .env.prod .env.prod.backup.$(date +%Y%m%d_%H%M%S)

# Update production environment
echo "🔧 Updating production configuration..."
cp .env.prod .env

# Deploy with production compose
echo "🐳 Deploying containers..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Validate deployment
echo "🔍 Validating deployment..."
./validate-deployment.sh

echo "✅ Production deployment complete!"
echo "🌐 Visit: https://scanner.hales.ai"
```

### Phase 4: Camera Functionality Integration

#### 4.1 Production Camera Testing
- Verify camera permissions work in production HTTPS environment
- Test fire extinguisher tag shape rendering
- Validate image capture and processing pipeline
- Ensure camera works across different browsers

#### 4.2 Camera-Specific Environment Considerations
```javascript
// Production camera constraints
const productionCameraConfig = {
    video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: { ideal: "environment" } // Prefer back camera on mobile
    }
};
```

## 🔒 Security & Backup Procedures

### Environment File Security
- Never commit `.env` or `.env.prod` to version control
- Use `.env.example` as template only
- Rotate API keys regularly
- Monitor webhook endpoints for unauthorized access

### Backup Strategy
```bash
# Database backup
docker exec mongo-container mongodump --out /backup/$(date +%Y%m%d)

# Configuration backup
tar -czf config-backup-$(date +%Y%m%d).tar.gz .env.prod docker/ nginx/
```

## 📊 Monitoring & Validation

### Health Check Endpoints
- `GET /api/health` - Backend health status
- `GET /` - Frontend availability
- Camera functionality test page

### Performance Metrics
- Container startup time
- API response times
- Image processing speed
- Camera initialization time

## 🎯 Success Criteria

### Local Development
- [ ] Easy switching between environments
- [ ] Camera functionality works locally
- [ ] All API endpoints responding
- [ ] Database connections stable

### Production Deployment
- [ ] HTTPS working with valid SSL
- [ ] Camera functionality in production
- [ ] API keys properly configured
- [ ] Webhook integrations functional
- [ ] No redirect loops or SSL issues

## 📝 Next Steps

1. **Review this plan** - Ensure all requirements are covered
2. **Switch to Code mode** - Implement the configuration changes
3. **Test locally** - Validate changes work in development
4. **Deploy to production** - Execute production deployment
5. **Validate deployment** - Run full system tests

---

**Ready for Implementation:** This plan addresses all identified issues and provides a robust foundation for managing both development and production environments.