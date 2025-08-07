## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │────│    Backend      │────│    MongoDB      │
│  React + Vite   │    │    FastAPI      │    │   Database      │
│  Tailwind CSS   │    │    Python       │    │   Collections   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                      │
         │                        ▼                      │
         │              ┌─────────────────┐              │
         │              │   OpenRouter    │              │
         │              │  Gemini 2.5 Pro │              │
         │              └─────────────────┘              │
         │                        │                      │
         ▼                        ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │     Stripe      │    │      N8n        │
│  Reverse Proxy  │    │   Payments      │    │   Webhooks      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📂 Project Structure

```
fire-safety-scanner/
├── 📁 backend/                 # FastAPI backend application
│   ├── server.py              # Main FastAPI server with all endpoints
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend environment variables
│
├── 📁 frontend/               # React frontend application  
│   ├── 📁 src/
│   │   ├── App.js             # Main React component
│   │   ├── App.css            # Application styles
│   │   ├── index.js           # React entry point
│   │   └── index.css          # Global styles
│   ├── 📁 public/
│   │   └── index.html         # HTML template
│   ├── package.json           # Node.js dependencies
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   └── .env                   # Frontend environment variables
│
├── 📁 docker/                 # Docker configuration files
│   ├── nginx.conf             # Nginx configuration
│   ├── nginx-ssl.conf         # SSL-enabled Nginx config
│   └── supervisord.conf       # Process management
│
├── 📁 sample_data/            # Sample data for development/demo
│   └── init-sample-data.js    # MongoDB initialization script
│
├── 🐳 Dockerfile              # Multi-stage Docker build
├── 🐳 docker-compose.yml      # Development deployment
├── 🐳 docker-compose.prod.yml # Production deployment with SSL
├── 🚀 quick-deploy.sh         # One-command deployment script
├── 📖 DEPLOYMENT.md           # Detailed deployment guide
├── 🔧 .env.example            # Environment variables template
└── 📋 README.md               # This file