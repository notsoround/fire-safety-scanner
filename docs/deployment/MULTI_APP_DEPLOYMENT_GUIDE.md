# 🚀 Multi-App Deployment Guide for DigitalOcean Droplet

**Safe deployment of additional applications without interfering with Fire Safety Scanner**

---

## 📊 **CURRENT DEPLOYMENT STATUS**

### **Fire Safety Scanner (Currently Running)**
- **Domain**: `scanner.hales.ai`
- **Directory**: `/root/projects/fire-safety-scanner/`
- **Ports Used**:
  - `8080:80` - Frontend (nginx)
  - `8001:8001` - Backend API
  - `27017` - MongoDB (internal only)
- **Docker Network**: `app-network`
- **Docker Compose**: `docker-compose.prod.yml`

---

## 🎯 **DEPLOYMENT STRATEGY FOR NEW APP**

### **1. Directory Structure (Recommended)**

```bash
/root/projects/
├── fire-safety-scanner/          # ✅ EXISTING - DON'T TOUCH
│   ├── docker-compose.prod.yml
│   ├── .env.prod
│   └── ...
└── your-new-app/                 # 🆕 NEW APP LOCATION
    ├── docker-compose.yml
    ├── .env
    └── ...
```

### **2. Port Allocation Strategy**

| App | Frontend Port | Backend Port | Database Port | Status |
|-----|---------------|--------------|---------------|---------|
| Fire Safety Scanner | 8080:80 | 8001:8001 | 27017 (internal) | ✅ **IN USE** |
| **Your New App** | 8090:80 | 8002:8000 | 5432 (if needed) | 🆕 **AVAILABLE** |
| Future App 3 | 8100:80 | 8003:8000 | 5433 (if needed) | 🔮 **RESERVED** |

---

## 📋 **STEP-BY-STEP DEPLOYMENT INSTRUCTIONS**

### **Step 1: Choose Available Ports**

**✅ SAFE PORTS TO USE:**
- Frontend: `8090`, `8100`, `8110`, etc.
- Backend: `8002`, `8003`, `8004`, etc.
- Database: `5432`, `5433`, `3307`, etc.

**❌ AVOID THESE PORTS:**
- `8080` - Fire Safety Scanner frontend
- `8001` - Fire Safety Scanner backend
- `27017` - MongoDB (even if internal)
- `80`, `443` - System ports

### **Step 2: Create New App Directory**

```bash
# SSH into your droplet
ssh root@134.199.239.171

# Navigate to projects directory
cd /root/projects/

# Create new app directory
mkdir your-new-app
cd your-new-app
```

### **Step 3: Setup Docker Compose for New App**

Create `docker-compose.yml` with **different ports**:

```yaml
# Example docker-compose.yml for new app
version: '3.8'

services:
  new-app:
    build:
      context: .
    ports:
      - "8090:80"    # Different port from 8080
      - "8002:8000"  # Different port from 8001
    env_file:
      - .env
    restart: unless-stopped
    networks:
      - new-app-network  # Different network name

  # If you need a database
  postgres:  # Different from mongo
    image: postgres:15
    ports:
      - "5432:5432"  # Different port from 27017
    environment:
      POSTGRES_DB: newappdb
      POSTGRES_USER: newappuser
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - new-app-network

networks:
  new-app-network:  # Isolated network
    driver: bridge

volumes:
  postgres_data:  # Different volume name
```

### **Step 4: Configure Environment File**

Create `.env` file with your app-specific variables:

```bash
# .env for new app
DB_PASSWORD=your_secure_password
API_KEY=your_api_key
PORT=8000
# ... other variables
```

### **Step 5: Deploy New App**

```bash
# Build and start your new app
docker-compose up -d --build

# Verify it's running
docker-compose ps

# Check logs
docker-compose logs -f
```

### **Step 6: Verify Both Apps Are Running**

```bash
# Check all running containers
docker ps

# Test Fire Safety Scanner (should still work)
curl -I http://localhost:8080

# Test new app
curl -I http://localhost:8090

# Check port usage
netstat -tulpn | grep :808
netstat -tulpn | grep :800
```

---

## 🌐 **DOMAIN/SUBDOMAIN SETUP**

### **Option 1: Use Different Ports (Simplest)**
- Fire Safety Scanner: `https://scanner.hales.ai` (port 8080)
- New App: `http://your-droplet-ip:8090`

### **Option 2: Setup Subdomain (Recommended)**
- Fire Safety Scanner: `https://scanner.hales.ai`
- New App: `https://newapp.hales.ai`

**For Option 2, you'll need reverse proxy setup:**

1. **Update DNS**: Add A record for `newapp.hales.ai` → `134.199.239.171`
2. **Configure nginx** (see advanced section below)

---

## 🔧 **ADVANCED: REVERSE PROXY SETUP**

If you want to use subdomains, create a main nginx reverse proxy:

### **Step 1: Create Main Nginx Config**

```bash
# Create main nginx directory
mkdir -p /root/nginx-proxy
cd /root/nginx-proxy
```

### **Step 2: Create nginx.conf**

```nginx
# /root/nginx-proxy/nginx.conf
events {
    worker_connections 1024;
}

http {
    # Fire Safety Scanner
    server {
        listen 80;
        server_name scanner.hales.ai;
        
        location / {
            proxy_pass http://localhost:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    
    # New App
    server {
        listen 80;
        server_name newapp.hales.ai;
        
        location / {
            proxy_pass http://localhost:8090;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### **Step 3: Create Docker Compose for Reverse Proxy**

```yaml
# /root/nginx-proxy/docker-compose.yml
version: '3.8'

services:
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"  # For SSL later
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    restart: unless-stopped
    network_mode: host  # Access localhost ports
```

---

## ⚠️ **SAFETY CHECKLIST**

### **Before Deploying New App:**
- [ ] **Backup Fire Safety Scanner**: 
  ```bash
  cd /root/projects/fire-safety-scanner
  docker-compose -f docker-compose.prod.yml down
  tar -czf ../fire-safety-scanner-backup-$(date +%Y%m%d_%H%M%S).tar.gz .
  docker-compose -f docker-compose.prod.yml up -d
  ```

- [ ] **Verify Fire Safety Scanner is running**: 
  ```bash
  curl -I https://scanner.hales.ai
  ```

- [ ] **Check available ports**: 
  ```bash
  netstat -tulpn | grep :8090  # Should be empty
  netstat -tulpn | grep :8002  # Should be empty
  ```

### **After Deploying New App:**
- [ ] **Test Fire Safety Scanner**: Visit `https://scanner.hales.ai`
- [ ] **Test new app**: Visit your new app URL
- [ ] **Check docker containers**: `docker ps -a`
- [ ] **Monitor logs**: `docker-compose logs -f` in both app directories

---

## 🚨 **EMERGENCY ROLLBACK**

If something goes wrong with the new app:

```bash
# Navigate to new app directory
cd /root/projects/your-new-app

# Stop new app containers
docker-compose down

# Remove containers and networks
docker-compose down --volumes --remove-orphans

# Fire Safety Scanner should continue running normally
```

If Fire Safety Scanner is affected:

```bash
# Navigate to Fire Safety Scanner
cd /root/projects/fire-safety-scanner

# Restart Fire Safety Scanner
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Check status
curl -I https://scanner.hales.ai
```

---

## 📝 **DEPLOYMENT COMMANDS SUMMARY**

### **Quick Start Commands:**

```bash
# SSH into droplet
ssh root@134.199.239.171

# Create new app directory
cd /root/projects && mkdir your-new-app && cd your-new-app

# Upload your app files (git clone, scp, etc.)
git clone https://github.com/yourusername/your-new-app.git .

# Create docker-compose.yml with ports 8090:80, 8002:8000
# Create .env file with your variables

# Deploy
docker-compose up -d --build

# Test both apps
curl -I https://scanner.hales.ai  # Fire Safety Scanner
curl -I http://134.199.239.171:8090  # Your new app
```

---

## 💡 **BEST PRACTICES**

1. **Isolation**: Use separate Docker networks for each app
2. **Port Management**: Keep a port registry document
3. **Monitoring**: Set up health checks for all apps
4. **Backups**: Regular backups before major changes
5. **Naming**: Use descriptive container and network names
6. **Resources**: Monitor CPU/memory usage with `docker stats`

---

## 🔗 **USEFUL COMMANDS**

```bash
# View all containers
docker ps -a

# View all networks
docker network ls

# View all volumes
docker volume ls

# Monitor resource usage
docker stats

# View logs for specific app
cd /root/projects/your-new-app && docker-compose logs -f

# Restart specific app
cd /root/projects/your-new-app && docker-compose restart
```

---

**🎯 This setup ensures complete isolation between your Fire Safety Scanner and any new applications, preventing conflicts and maintaining system stability!**

---

*Last Updated: August 9, 2025*
*For questions: Check this guide or test in staging first*


