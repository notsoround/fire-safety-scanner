# Fire Safety Scanner - Deployment Guide

## Overview
Fire Safety Scanner is a full-stack web application for AI-powered fire extinguisher inspection analysis. This deployment package includes everything needed to run the application on Digital Ocean or any Docker-compatible environment. **Internal team version with unlimited inspections and no payment requirements.**

## Features
- 🔥 AI-powered fire extinguisher tag analysis using Gemini 2.5 Pro
- 📱 Camera integration for on-site photo capture
- ✏️ Manual editing of analysis results
- 🔔 Automated alerts for due inspections
- 📊 Complete inspection history and management
- 🎨 Modern glassmorphism UI with responsive design

## Tech Stack
- **Frontend**: React 19, Tailwind CSS
- **Backend**: FastAPI (Python), MongoDB
- **AI/LLM**: OpenRouter Gemini 2.5 Pro
- **Deployment**: Docker, Nginx

## Digital Ocean Deployment

### Prerequisites
- Digital Ocean Droplet (minimum 2GB RAM, 1 CPU)
- Docker and Docker Compose installed
- Domain name (optional but recommended)

### Step 1: Prepare Your Droplet

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in to apply Docker group changes
```

### Step 2: Deploy the Application

```bash
# Upload the export package to your droplet
scp fire-safety-scanner-export.tar.gz user@your-droplet-ip:~/

# SSH into your droplet
ssh user@your-droplet-ip

# Extract the package
tar -xzf fire-safety-scanner-export.tar.gz
cd fire-safety-scanner

# Configure environment variables
cp .env.example .env
nano .env  # Edit with your API keys
```

### Step 3: Configure Environment Variables

Create a `.env` file with your API keys:

```env
# Required API Keys
OPENROUTER_API_KEY=your_openrouter_api_key_here
N8N_WEBHOOK_URL=your_n8n_webhook_url_here

# Database Configuration (will use Docker MongoDB)
MONGO_URL=mongodb://mongo:27017
DB_NAME=fire_safety_db

# Optional: Domain configuration
DOMAIN=your-domain.com
```

### Step 4: Start the Application

```bash
# Build and start all services
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs if needed
docker-compose logs -f
```

### Step 5: Configure Firewall (if needed)

```bash
# Allow HTTP and HTTPS traffic
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## API Keys Required

### 1. OpenRouter API Key
- Sign up at: https://openrouter.ai/
- Go to: https://openrouter.ai/keys
- Create a new API key
- Ensure you have credits for Gemini 2.5 Pro model

### 2. Stripe API Key
- Sign up at: https://stripe.com/
- Go to: https://dashboard.stripe.com/apikeys
- Use your publishable key (starts with `pk_`)
- For production, use live keys; for testing, use test keys

### 3. N8n Webhook URL (Optional)
- If you have an N8n automation workflow
- Create a webhook trigger node
- Copy the webhook URL

## Sample Data

The deployment includes sample data with:
- 2 demo users
- 5 sample fire extinguisher inspections
- Various conditions (Good, Fair, Poor)
- Different extinguisher types (ABC, CO2, Class K, Foam)
- Payment transaction examples

## Managing the Application

### View Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs mongo
```

### Update the Application
```bash
# Pull latest changes (if updating)
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

### Backup Database
```bash
# Create database backup
docker exec -i fire-safety-scanner_mongo_1 mongodump --db fire_safety_db --archive > backup_$(date +%Y%m%d_%H%M%S).archive

# Restore database backup
docker exec -i fire-safety-scanner_mongo_1 mongorestore --db fire_safety_db --archive < backup_file.archive
```

### SSL/HTTPS Setup (Recommended)

For production use with a domain:

```bash
# Install Certbot
sudo apt install certbot

# Generate SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Update docker-compose.yml to include SSL configuration
# (See docker-compose.prod.yml for SSL configuration)
```

## Troubleshooting

### Common Issues

1. **Application not accessible**
   - Check if ports 80 and 8001 are open
   - Verify Docker containers are running: `docker-compose ps`
   - Check logs: `docker-compose logs`

2. **Database connection issues**
   - Ensure MongoDB container is running
   - Check if MONGO_URL is correct in .env file

3. **AI analysis not working**
   - Verify OPENROUTER_API_KEY is correct
   - Check if you have credits in your OpenRouter account
   - View backend logs: `docker-compose logs backend`

4. **Payment issues**
   - Verify STRIPE_API_KEY is correct
   - Check Stripe dashboard for webhook events
   - Ensure you're using the right key (test vs live)

### Support

For technical issues:
- Check the logs first: `docker-compose logs`
- Verify all environment variables are set
- Ensure all required API keys are valid

## Development Mode

To run in development mode:

```bash
# Start only the database
docker-compose up -d mongo

# Run backend locally
cd backend
pip install -r requirements.txt
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Run frontend locally (in another terminal)
cd frontend  
yarn install
yarn start
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Frontend    │────│     Backend     │────│    MongoDB      │
│   React + TW    │    │     FastAPI     │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                      
         │                        │                      
         v                        v                      
┌─────────────────┐    ┌─────────────────┐              
│     Nginx       │    │   OpenRouter    │              
│   (Proxy)       │    │   Gemini 2.5    │              
└─────────────────┘    └─────────────────┘              
```

## License

This project is deployed with all necessary configurations for immediate use.