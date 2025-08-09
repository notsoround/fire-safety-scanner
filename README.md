# 🔥 Fire Safety Scanner

**A lead generation and client retention engine for Pye Barker field technicians, powered by AI with enhanced data capture for service company information, equipment numbers, and service details.**

[![Status](https://img.shields.io/badge/Status-Enhanced%20Data%20Capture%20Complete-brightgreen)](https://scanner.hales.ai)
[![AI](https://img.shields.io/badge/AI-Gemini%202.5%20Pro-blue)](https://openrouter.ai)
[![Database](https://img.shields.io/badge/Database-MongoDB-green)](https://mongodb.com)

**Live Application**: [https://scanner.hales.ai](https://scanner.hales.ai)

---

## 🧭 Core Vision & Strategy

Transform routine fire extinguisher inspections into strategic business activities through AI-powered analysis and automated data capture.

### **Business Impact**
1. **Client Retention**: Automated tracking ensures no compliance lapses, securing recurring revenue
2. **Lead Generation**: Effortless competitor extinguisher logging builds proprietary sales database
3. **Technician Empowerment**: **See Tag → Snap Picture → AI Analyzes → Verify → Submit**

---

## 🚀 Current Production Status

### **✅ Fully Operational System**
- **Frontend**: React application with camera functionality
- **Backend**: FastAPI with 8-layer enhanced AI analysis pipeline
- **Database**: MongoDB with persistent inspection storage
- **AI**: Gemini 2.5 Pro via OpenRouter for image analysis
- **Domain**: HTTPS-secured at scanner.hales.ai
- **Infrastructure**: Docker containers on Digital Ocean

### **📊 Live Metrics**
- **Inspections Stored**: 5+ verified entries
- **AI Analysis**: Real Gemini responses confirmed
- **Uptime**: All services operational
- **SSL**: Valid certificates and secure access

---

## 🏗️ Architecture

### **Technology Stack**
- **Frontend**: React 18 + Tailwind CSS + Camera API
- **Backend**: FastAPI + Python 3.11 + litellm
- **Database**: MongoDB 6.0 (containerized)
- **AI**: OpenRouter → Gemini 2.5 Pro
- **Deployment**: Docker Compose + nginx + SSL
- **Infrastructure**: Digital Ocean Droplet

### **Enhanced AI Analysis Pipeline**
1. **Layer 1**: OCR text extraction from inspection tag
2. **Layer 2**: Parallel date analysis (Year/Month/Day)
3. **Layer 3**: Parallel classification (Type/Condition)
4. **Layer 4**: Service company information extraction (Name/Address/Phone/Website)
5. **Layer 5**: Equipment number identification (AE#/HE#/EE#/FE#)
6. **Layer 6**: Service details analysis (Inspection type/Additional services)
7. **Layer 7**: Enhanced consolidation into structured JSON
8. **Output**: Comprehensive inspection data with service company info, equipment numbers, and confidence scores

---

## 📁 Project Documentation

| File | Purpose |
|------|---------|
| **[`DEPLOYMENT_STATUS.md`](./DEPLOYMENT_STATUS.md)** | Current production status and health metrics |
| **[`specs/AI_MODEL.md`](./specs/AI_MODEL.md)** | AI model specifications and requirements |
| **[`specs/API_REFERENCE.md`](./specs/API_REFERENCE.md)** | Complete API endpoint documentation |
| **[`specs/ARCHITECTURE.md`](./specs/ARCHITECTURE.md)** | System architecture and file structure |
| **[`DEPLOYMENT.md`](./DEPLOYMENT.md)** | Deployment procedures and troubleshooting |

---

## 🚀 Quick Start (Local Development)

### **Prerequisites**
- Docker & Docker Compose
- Node.js 20+ (for frontend development)
- Python 3.11+ (for backend development)

### **1. Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Configure with your API keys
nano .env
```

### **2. Local Development**
```bash
# Start all services
docker-compose up -d

# Frontend development server
cd frontend && npm start

# Backend development server
cd backend && python server_local.py
```

### **3. Production Deployment**
```bash
# Deploy to production
bash deploy-production.sh

# Validate deployment
bash validate-deployment.sh
```

---

## 🔧 Production Configuration

### **Environment Variables**
```bash
# MongoDB Connection
MONGO_URL="mongodb://mongo:27017"
DB_NAME="production_database"

# React App Backend URL
REACT_APP_BACKEND_URL="https://scanner.hales.ai"

# API Keys
OPENROUTER_API_KEY="sk-or-v1-[your-key]"
N8N_WEBHOOK_URL="https://automate.hales.ai/webhook/[webhook-id]"
```

### **Key Features**
- **Camera Integration**: Native browser camera API with fire extinguisher tag overlay
- **Enhanced AI Analysis**: Real-time Gemini 2.5 Pro image analysis with service company, equipment, and service detail extraction
- **Data Persistence**: MongoDB with inspection history
- **Responsive Design**: Mobile-first interface for field technicians
- **Secure Access**: HTTPS with SSL certificates

---

## 📊 API Documentation

### **🔗 Complete API Reference**
**📖 [View Complete API Documentation](specs/API_REFERENCE_COMPLETE.md)**

**Key Features:**
- **🚨 Critical Server Access Instructions** (Pipeline stability warnings)
- **🔐 Authentication Endpoints** (Demo login, session management)
- **🔍 Inspection Management** (Create, read, update, delete)
- **💾 Database Schema** (Complete data models)
- **🧪 Testing Examples** (cURL commands and workflows)
- **🔧 Deployment Commands** (Docker, database access)

### **⚡ Quick API Test**
```bash
# Health check
curl https://scanner.hales.ai/api/health

# Demo login
curl -X POST https://scanner.hales.ai/api/auth/demo-login

# Get inspections
curl -H "Session-Token: your-token" https://scanner.hales.ai/api/inspections
```

### **🚨 Server Access (Important)**
```bash
# CRITICAL: Use combined commands due to unstable SSH pipeline
ssh root@134.199.239.171 "cd projects/fire-safety-scanner && [your-command]"
```

---

## 🎯 Field Technician Workflow

1. **Access Application**: Navigate to https://scanner.hales.ai
2. **Capture Image**: Use camera to photograph fire extinguisher tag
3. **Enhanced AI Analysis**: Gemini automatically extracts inspection data, service company information, equipment numbers, and service details
4. **Review Results**: Verify AI analysis accuracy
5. **Submit Inspection**: Save to database with location notes
6. **View History**: Access previous inspections and due dates

---

## 🔍 Monitoring & Maintenance

### **Health Checks**
```bash
# System status
curl -I https://scanner.hales.ai/

# API health
curl https://scanner.hales.ai/api/health

# Database status
docker exec mongo-container mongosh --eval "db.inspections.countDocuments()"
```

### **Log Access**
```bash
# Application logs
docker logs fire-safety-scanner-main-app-1

# Database logs
docker logs fire-safety-scanner-mongo-1
```

---

## 📈 Future Enhancements

- **Advanced Analytics**: Inspection trend analysis and reporting
- **Mobile App**: Native iOS/Android applications
- **Offline Mode**: Local storage with sync capabilities
- **Multi-tenant**: Support for multiple fire safety companies
- **Integration**: CRM and scheduling system connections

---

**The Fire Safety Scanner is production-ready and actively serving field technicians with AI-powered inspection capabilities.**