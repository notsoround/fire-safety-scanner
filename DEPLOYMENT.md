# 🚀 Production Deployment Guide

**Status**: ✅ **PRODUCTION READY**  
**Last Updated**: August 4, 2025  
**Live System**: https://scanner.hales.ai

This guide provides deployment procedures for the Fire Safety Scanner application. The system is currently **fully operational** in production.

---

## 📋 Quick Reference

- **Live Application**: [https://scanner.hales.ai](https://scanner.hales.ai)
- **Server**: Digital Ocean Droplet (134.199.239.171)
- **Status**: All services operational and healthy
- **Database**: 5+ inspections stored and retrievable
- **AI**: Gemini 2.5 Pro providing real analysis responses

---

## 🎯 Current Production Status

### **✅ Operational Components**
- **Frontend**: React app with camera functionality
- **Backend**: FastAPI with AI analysis pipeline  
- **Database**: MongoDB containerized with persistent storage
- **AI Analysis**: Gemini 2.5 Pro via OpenRouter
- **SSL/HTTPS**: Valid certificates and secure access
- **Container Stack**: Docker Compose services healthy

### **🔧 Verified Configuration**
- **Domain**: https://scanner.hales.ai (SSL enabled)
- **API Endpoints**: All responding correctly
- **Database**: MongoDB with inspection persistence
- **AI Model**: `openrouter/google/gemini-2.5-pro` working
- **Environment**: Production variables configured

---

## 🔑 Production Environment

### **Environment Variables** (`.env.prod`)
```bash
# MongoDB Connection
MONGO_URL="mongodb://mongo:27017"
DB_NAME="production_database"

# React App Backend URL
REACT_APP_BACKEND_URL="https://scanner.hales.ai"

# API Keys
OPENROUTER_API_KEY="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"
N8N_WEBHOOK_URL="https://automate.hales.ai/webhook/416c17d3-05ef-4589-ac7b-7b3b9b47814b"
```

### **Container Configuration** (`docker-compose.prod.yml`)
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      args:
        - REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}
    ports:
      - "8080:80"      # Frontend
      - "8001:8001"    # Backend API
    env_file:
      - .env.prod
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
      - ./sample_data:/docker-entrypoint-initdb.d
    restart: unless-stopped

volumes:
  mongo_data:
```

---

## 🚀 Deployment Procedures

### **1. Automated Production Deployment**
```bash
# Enhanced production deployment with validation
bash deploy-production.sh
```

**This script performs:**
1. Creates backup of current configuration
2. Updates production environment variables
3. Deploys with production Docker Compose
4. Waits for services to start
5. Validates deployment health
6. Reports deployment status

### **2. Manual Deployment Steps**
```bash
# 1. Navigate to project directory
cd /root/projects/fire-safety-scanner

# 2. Pull latest code (if needed)
git pull origin main

# 3. Update environment variables
nano .env.prod

# 4. Deploy containers
docker-compose -f docker-compose.prod.yml up -d --build

# 5. Verify deployment
bash validate-deployment.sh
```

### **3. Environment Switching**
```bash
# Switch to development
bash switch-env.sh dev

# Switch to production  
bash switch-env.sh prod
```

---

## 🔍 Health Monitoring

### **System Health Checks**
```bash
# Domain accessibility
curl -I https://scanner.hales.ai/

# API health endpoint
curl https://scanner.hales.ai/api/health

# Container status
docker ps

# Database connectivity
docker exec fire-safety-scanner-mongo-1 mongosh production_database --eval "db.inspections.countDocuments()"
```

### **Expected Responses**
```bash
# Domain check
HTTP/2 200 
server: nginx/1.26.0 (Ubuntu)

# API health
{"status":"healthy","timestamp":"2025-08-04T20:21:55.109081"}

# Database count
5  # (or current number of inspections)
```

---

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **Container Issues**
```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Rebuild containers
docker-compose -f docker-compose.prod.yml up -d --build

# Check container logs
docker logs fire-safety-scanner-main-app-1
docker logs fire-safety-scanner-main-mongo-1
```

#### **Database Issues**
```bash
# Check MongoDB connection
docker exec fire-safety-scanner-mongo-1 mongosh --eval "db.runCommand('ping')"

# Verify data persistence
docker exec fire-safety-scanner-mongo-1 mongosh production_database --eval "db.inspections.find().limit(1)"
```

#### **AI Analysis Issues**
```bash
# Check backend logs for AI errors
docker exec fire-safety-scanner-main-app-1 tail -50 /var/log/supervisor/backend.out.log

# Test AI endpoint directly
curl -X POST http://localhost:8001/api/inspections \
  -H "Content-Type: application/json" \
  -d '{"location":"test","image_base64":"[base64]","notes":"test"}'
```

---

## 📊 Deployment Validation

### **Validation Checklist**
- [ ] Domain responds with HTTP 200
- [ ] API health endpoint returns success
- [ ] Database contains inspection data
- [ ] AI analysis returns real responses
- [ ] Frontend loads and displays data
- [ ] SSL certificates are valid
- [ ] All containers are running

### **Automated Validation**
```bash
# Run complete validation suite
bash validate-deployment.sh

# Expected output:
# ✅ Domain accessible
# ✅ API responding
# ✅ Database connected
# ✅ AI analysis working
# ✅ Frontend operational
```

---

## 🔐 Security Configuration

### **SSL/HTTPS Setup**
- **Certificates**: Let's Encrypt via Certbot
- **Domain**: scanner.hales.ai
- **Renewal**: Automatic via cron job
- **Security Headers**: Configured in nginx

### **Network Security**
- **Firewall**: UFW configured for necessary ports
- **Container Network**: Internal Docker network
- **Database**: Not exposed externally
- **API**: Rate limiting and CORS configured

---

## 📈 Performance Monitoring

### **Key Metrics**
- **Response Time**: API endpoints <500ms
- **AI Analysis**: ~10-15 seconds for complete analysis
- **Database**: Sub-second query response
- **Uptime**: 99.9% target availability

### **Log Monitoring**
```bash
# Application logs
docker logs fire-safety-scanner-main-app-1 --tail 100 -f

# Database logs
docker logs fire-safety-scanner-mongo-1 --tail 100 -f

# System logs
journalctl -u docker -f
```

---

## 🎯 Production Ready

The Fire Safety Scanner is **fully deployed and operational** with:

- ✅ **Complete AI Pipeline**: Gemini 2.5 Pro analysis working
- ✅ **Data Persistence**: MongoDB storing inspections
- ✅ **Secure Access**: HTTPS with valid SSL certificates
- ✅ **Container Orchestration**: All services healthy
- ✅ **Monitoring**: Health checks and validation in place

**The system is ready for field technician use and production workloads.**