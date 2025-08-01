#!/bin/bash

# Fire Safety Scanner SSL Setup Script
# This script sets up HTTPS for the Fire Safety Scanner

echo "🔒 Setting up HTTPS for Fire Safety Scanner..."

# Install Certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    apt update
    apt install -y certbot nginx
fi

# Create nginx configuration for Fire Safety Scanner with SSL
cat > /etc/nginx/sites-available/fire-safety-scanner << 'EOF'
server {
    listen 80;
    server_name scanner.hales.ai;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name scanner.hales.ai;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/scanner.hales.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/scanner.hales.ai/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/fire-safety-scanner /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t

echo "✅ Nginx configuration created."
echo "📝 Next steps:"
echo "1. Set up DNS: Create an A record for 'scanner.hales.ai' pointing to 134.199.239.171"
echo "2. Get SSL certificate: sudo certbot --nginx -d scanner.hales.ai"
echo "3. The Fire Safety Scanner will be available at: https://scanner.hales.ai"