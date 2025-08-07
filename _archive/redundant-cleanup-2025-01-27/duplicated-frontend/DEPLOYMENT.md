# Production Deployment Guide

This guide provides step-by-step instructions for deploying the Fire Safety Scanner application to a production environment on a Digital Ocean droplet.

## 📋 Quick Reference

- **Environment Management:** See [`ENVIRONMENT_MANAGEMENT_PLAN.md`](./ENVIRONMENT_MANAGEMENT_PLAN.md) for comprehensive environment setup and switching procedures
- **Camera Implementation:** See [`FIRE_EXTINGUISHER_CAMERA_IMPLEMENTATION.md`](./FIRE_EXTINGUISHER_CAMERA_IMPLEMENTATION.md) for camera feature status
- **Build History:** See [`BUILD_LOG.md`](./BUILD_LOG.md) for latest deployment metrics

## 1. Prerequisites

- A Digital Ocean droplet with Docker and Docker Compose installed.
- A registered domain name pointed to your droplet's IP address.
- A configured `.env.prod` file with your production environment variables.
- SSL certificates configured for your domain.

## 2. Environment Configuration

### 2.1 Production Environment Setup

The `.env.prod` file should contain your actual production API keys and configuration:

```bash
# Production Environment Variables
MONGO_URL="mongodb://mongo:27017"
DB_NAME="production_database"
REACT_APP_BACKEND_URL="https://scanner.hales.ai"

# API Keys (Replace with actual values)
OPENROUTER_API_KEY="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"
N8N_WEBHOOK_URL="https://automate.hales.ai/webhook/416c17d3-05ef-4589-ac7b-7b3b9b47814b"
```

### 2.2 SSL Configuration

Ensure your `docker/nginx-ssl.conf` is configured for your domain:

```nginx
ssl_certificate /etc/letsencrypt/live/scanner.hales.ai/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/scanner.hales.ai/privkey.pem;
```

## 3. Nginx and SSL Configuration

This application uses Nginx to serve the frontend and proxy requests to the backend. For production, it's essential to enable SSL. You'll need to replace the default Nginx configuration with the SSL-enabled version.

1.  **Backup the default Nginx configuration:**
    ```bash
    sudo mv /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak
    ```
2.  **Copy the SSL Nginx configuration:**
    ```bash
    sudo cp docker/nginx-ssl.conf /etc/nginx/sites-available/default
    ```
3.  **Obtain an SSL certificate from Let's Encrypt:**
    ```bash
    sudo certbot --nginx -d your_domain.com
    ```
    *Replace `your_domain.com` with your actual domain name.*

## 4. Enhanced Deployment Process

### 4.1 Automated Deployment Script

Use the enhanced deployment script for production deployments:

```bash
# Enhanced production deployment with validation
bash deploy-production.sh
```

This script will:
1. Create backup of current configuration
2. Update production environment variables
3. Deploy with production Docker Compose
4. Wait for services to start
5. Validate deployment health
6. Report deployment status

### 4.2 Manual Deployment (Alternative)

If you prefer manual deployment, use the original script:

```bash
bash remote_deploy.sh
```

### 4.3 Environment Switching

To switch between development and production environments:

```bash
# Switch to development
bash switch-env.sh dev

# Switch to production
bash switch-env.sh prod
```

### 4.4 Deployment Validation

After deployment, validate the system health:

```bash
bash validate-deployment.sh
```

This will test:
- Container health (HTTP 200 response)
- Backend API functionality
- Production domain accessibility (if in prod mode)
- Camera functionality status

## 5. Camera Feature Considerations

### 5.1 Production Camera Requirements

The camera feature requires HTTPS in production for security:
- Camera permissions only work over HTTPS
- Fire extinguisher tag shape rendering
- Image capture and processing pipeline

### 5.2 Camera Testing Checklist

- [ ] Camera permissions granted in browser
- [ ] Fire extinguisher tag shape displays correctly
- [ ] Image capture functionality works
- [ ] Captured images process correctly
- [ ] Cross-browser compatibility verified

## 6. Troubleshooting

### 6.1 Common Issues

**Redirect Loop (Fixed)**
- Issue: Infinite redirects between HTTP/HTTPS
- Solution: Use `nginx.conf` instead of `nginx-ssl.conf` in container
- Reference: See `_archive/DEPLOY_FIX.md` for details

**Camera Not Working**
- Check HTTPS is properly configured
- Verify camera permissions in browser
- Check browser console for errors
- Test with different browsers

**API Keys Not Working**
- Verify `.env.prod` has correct API keys
- Check OpenRouter API key validity
- Validate N8N webhook URL accessibility

### 6.2 Health Check Commands

```bash
# Test container directly
curl -I http://localhost:8080/

# Test backend API
curl http://localhost:8001/api/health

# Test production domain
curl -I https://scanner.hales.ai/

# Check running containers
docker ps

# View container logs
docker-compose -f docker-compose.prod.yml logs -f
```

Your Fire Safety Scanner is now deployed and ready for production use with enhanced monitoring and validation.