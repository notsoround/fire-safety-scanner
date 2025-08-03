# Production Deployment Guide

This guide outlines the steps to deploy the Fire Safety Scanner application to a production environment on a Digital Ocean droplet.

## 1. Environment Variable Configuration

Create a `.env.prod` file in the root directory of the project on your server. This file will contain the production-specific environment variables.

```bash
# .env.prod

# --- Backend Configuration ---
# Your production MongoDB connection string
MONGO_URL="mongodb://<YOUR_PRODUCTION_MONGO_URL>" 
DB_NAME="<YOUR_PRODUCTION_DB_NAME>"

# --- Frontend Configuration ---
# The public URL of your application
REACT_APP_BACKEND_URL="https://scanner.hales.ai"

# --- API Keys & Webhooks ---
# Your production API keys and webhook URLs
OPENROUTER_API_KEY="<YOUR_PRODUCTION_OPENROUTER_API_KEY>"
N8N_WEBHOOK_URL="<YOUR_PRODUCTION_N8N_WEBHOOK_URL>"
```

**Note**: Ensure this file is properly secured and not publicly accessible.

## 2. Docker Compose for Production

The `docker-compose.prod.yml` file is configured to use the `.env.prod` file and is optimized for a production deployment.

## 3. Automated Deployment

The `remote_deploy.sh` script automates the deployment process. Once you are connected to your server, you can run this script to deploy the latest version of the application.

### Deployment Steps:

1.  **Connect to Your Server**:
    ```bash
    ssh root@<YOUR_DROPLET_IP>
    ```

2.  **Navigate to the Project Directory**:
    ```bash
    cd /path/to/your/project
    ```

3.  **Run the Deployment Script**:
    ```bash
    bash remote_deploy.sh