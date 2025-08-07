# 🔥 Fire Safety Scanner

**AI-Powered Fire Extinguisher Inspection Management System**

> **🚀 DEVELOPMENT STATUS**: For current development setup and running services, see [`DEV_STATUS.md`](DEV_STATUS.md)

A modern web application that uses AI to analyze fire extinguisher inspection tags, track maintenance schedules, and manage compliance records. Built with React, FastAPI, and MongoDB. **Internal team version with unlimited inspections and no payment requirements.**

![Fire Safety Scanner](https://images.unsplash.com/photo-1660165458059-57cfb6cc87e5?w=800&h=400&fit=crop)

---

## 🌟 Features

### 🤖 **AI-Powered Analysis**
- **Gemini 2.5 Pro Integration**: Advanced AI analysis of fire extinguisher inspection tags
- **Image Recognition**: Upload photos or use camera to capture inspection tags
- **Structured Data Extraction**: Automatically extracts dates, condition, type, and maintenance notes

### ✏️ **Manual Editing**
- **Edit AI Results**: Manually correct or update analysis results
- **Structured Fields**: Edit inspection dates, extinguisher type, condition, maintenance notes
- **Real-time Updates**: Changes are immediately saved and reflected in alerts

### 📱 **User Experience**
- **Camera Integration**: Take photos directly within the app
- **Location Tracking**: Tag each inspection with specific location
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Glassmorphism UI**: Modern, futuristic interface design

### 🚀 **Unlimited Usage**
- **No Payment Required**: Free unlimited inspections for internal team use
- **No Usage Limits**: Perform as many inspections as needed
- **Team Focused**: Designed for internal fire safety management

### 🔔 **Smart Alerts**
- **Due Date Tracking**: Automatic alerts for inspections due within 30 days
- **Dashboard Warnings**: Visual indicators for overdue inspections
- **Maintenance Flags**: Highlight extinguishers requiring attention

### 🔗 **Workflow Integration**
- **N8n Webhooks**: Automatically send inspection data to external workflows
- **API Access**: RESTful API for third-party integrations
- **Data Export**: Complete inspection history and reporting

---

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
```

---

## 🚀 Quick Start

### 1. **Download & Extract**
```bash
# Download the export package
# Extract it
tar -xzf fire-safety-scanner-export.tar.gz
cd fire-safety-scanner
```

### 2. **Configure Environment**
```bash
# Copy environment template
cp .env.example .env

# Edit with your API keys
nano .env
```

### 3. **Deploy with Docker**
```bash
# Make deploy script executable
chmod +x quick-deploy.sh

# Run the deployment script
./quick-deploy.sh
```

### 4. **Access Your Application**
- **Frontend**: http://your-server-ip:8080
- **Backend API**: http://your-server-ip:8001/api
- **API Docs**: http://your-server-ip:8001/docs

---

## 🔑 Required API Keys

### **OpenRouter API Key** 
- **Purpose**: AI analysis using Gemini 2.5 Pro
- **Get it**: https://openrouter.ai/keys
- **Cost**: Pay-per-use (typically ~$0.01 per analysis)

### **N8n Webhook URL** *(Optional)*
- **Purpose**: Automated workflow integration
- **Get it**: Create webhook trigger in N8n workflow
- **Use**: Send inspection data to external systems

---

## 💾 Database Schema

### **Users Collection**
```javascript
{
  id: "user-uuid",
  email: "user@example.com",
  name: "User Name",
  picture: "https://profile-image-url",
  created_at: ISODate
}
```

### **Inspections Collection**
```javascript
{
  id: "inspection-uuid",
  user_id: "user-uuid",
  location: "Building A - Floor 2",
  image_base64: "base64-encoded-image",
  inspection_date: ISODate,
  due_date: ISODate,
  status: "analyzed",
  gemini_response: "{JSON with analysis results}",
  notes: "Additional user notes",
  created_at: ISODate,
  updated_at: ISODate
}
```

### **Sessions Collection**
```javascript
{
  session_id: "emergent-session-id",
  user_id: "user-uuid", 
  session_token: "internal-session-token",
  expires_at: ISODate,
  created_at: ISODate
}
```

---

## 🔌 API Endpoints

### **Authentication**
- `POST /api/auth/session` - Create session from Emergent Auth
- `GET /api/auth/profile` - Get current user profile

### **Inspections**
- `POST /api/inspections` - Create new inspection with AI analysis
- `GET /api/inspections` - Get user's inspection history
- `PUT /api/inspections/{id}` - Update inspection data (manual editing)
- `GET /api/inspections/due` - Get inspections due within 30 days


### **Utility**
- `GET /api/health` - Health check endpoint

---

## 🎨 UI Components & Features

### **Login Page**
- Emergent Auth integration
- Glassmorphism design with gradient background
- Responsive layout

### **Dashboard**
- Inspection statistics (remaining, total, due soon)
- Due inspection alerts with visual indicators
- Image upload interface (file picker + camera)
- Location input and notes fields

### **Inspection History**
- Grid layout with inspection cards
- Image thumbnails and analysis results
- **Edit functionality** with structured form fields
- Status indicators and dates


### **Manual Editing Interface**
- **Structured form fields**:
  - Date pickers for inspection/due dates
  - Dropdown for condition (Good/Fair/Poor)
  - Text inputs for type and maintenance notes
  - Checkbox for "requires attention"
  - Location and additional notes
- **Save/Cancel buttons**
- **Real-time updates** to database and alerts

---

## 🛠️ Development

### **Local Development Setup**
```bash
# Backend
cd backend
pip install -r requirements.txt
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend (new terminal)
cd frontend
yarn install
yarn start
```

### **Environment Variables**

**Backend (.env)**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=fire_safety_db
OPENROUTER_API_KEY=your_key_here
N8N_WEBHOOK_URL=your_webhook_url
```

**Frontend (.env)**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## 🔧 Configuration


### **AI Analysis Prompt**
The system prompt for Gemini 2.5 Pro analysis:
- Extracts last inspection date, next due date
- Identifies extinguisher type (ABC, CO2, Class K, etc.)
- Assesses condition (Good/Fair/Poor)
- Notes maintenance requirements
- Flags items requiring attention

---

## 🚨 Troubleshooting

### **Common Issues**

**🔴 Application not accessible**
- Check if Docker containers are running: `docker-compose ps`
- Verify ports 80 and 8001 are open in firewall
- Check logs: `docker-compose logs`

**🔴 AI analysis failing**
- Verify OPENROUTER_API_KEY is correct
- Check OpenRouter account has sufficient credits
- View backend logs: `docker-compose logs backend`


**🔴 Database connection issues**
- Ensure MongoDB container is running
- Check MONGO_URL configuration
- Verify database initialization completed

### **Log Locations**
```bash
# All service logs
docker-compose logs

# Specific service logs  
docker-compose logs backend
docker-compose logs mongo

# Real-time logs
docker-compose logs -f
```

---

## 📊 Sample Data

The application includes sample data for demonstration:

- **2 demo users** for testing
- **5 sample inspections** with various conditions:
  - Building A - Main Entrance (Good condition, ABC type)
  - Kitchen Area (Fair condition, requires attention)
  - Loading Dock (Good condition, CO2 type)
  - Electrical Room (Poor condition, urgent service needed)
  - Parking Garage (Good condition, Foam type)

Sample data is automatically loaded when using Docker deployment.

---

## 🔒 Security Features

- **Session-based authentication** with token validation
- **Environment variable isolation** for sensitive data
- **CORS protection** with configurable origins
- **Input validation** using Pydantic models
- **SQL injection prevention** through MongoDB
- **XSS protection** via React's built-in sanitization
- **HTTPS support** for production deployments

---

## 📈 Performance & Scalability

- **Docker containerization** for consistent deployments
- **Nginx reverse proxy** for efficient request handling
- **MongoDB indexing** on user_id and due_date fields
- **Base64 image storage** for simplified deployment
- **Lazy loading** for inspection history
- **Responsive design** for mobile optimization

---

## 🔄 Updates & Maintenance

### **Application Updates**
```bash
# Pull latest changes
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

### **Database Backup**
```bash
# Create backup
docker exec -i container_name mongodump --db fire_safety_db --archive > backup.archive

# Restore backup
docker exec -i container_name mongorestore --db fire_safety_db --archive < backup.archive
```

### **SSL Certificate Renewal** *(for production)*
```bash
# Renew Let's Encrypt certificates
sudo certbot renew

# Restart nginx
docker-compose restart
```

---

## 📞 Support & Documentation

- **📖 Deployment Guide**: See `DEPLOYMENT.md` for detailed setup instructions
- **🐳 Docker Configuration**: Multi-stage builds with production optimizations
- **🚀 Quick Deploy**: Use `quick-deploy.sh` for one-command deployment
- **📋 API Documentation**: Available at `/docs` endpoint when running

---

## 🎯 Use Cases

### **Fire Safety Companies**
- Manage client inspections across multiple locations
- Generate compliance reports and documentation
- Track maintenance schedules and due dates
- Automate workflow integration with existing systems

### **Facility Managers**
- Monitor fire safety equipment across buildings
- Ensure compliance with safety regulations
- Track inspection history and maintenance records
- Receive alerts for overdue inspections

### **Inspection Services**
- Streamline inspection documentation process
- Use AI to reduce manual data entry errors
- Provide professional reports to clients
- Manage multiple client accounts with unlimited inspections

---

## ⚡ Key Benefits

- **🕐 Time Savings**: AI analysis reduces manual data entry by 90%
- **📊 Accuracy**: Structured data extraction eliminates transcription errors
- **🔔 Compliance**: Automated alerts ensure no missed inspections
- **📱 Mobility**: Camera integration for on-site inspections
- **✏️ Flexibility**: Manual editing ensures data accuracy
- **🔗 Integration**: Webhook support for existing workflows
- **🚀 Unlimited**: No usage limits or payment barriers for internal team

---
Here's an updated section for your Fire Safety Scanner `README.md` file, incorporating the crucial step of checking for existing services like n8n to avoid conflicts on your Digital Ocean droplet:

-----

### **Deployment Considerations for DigitalOcean Droplet (Coexistence with Hales.ai and other Services)**

When deploying the Fire Safety Scanner to your DigitalOcean droplet, it's critical to ensure it coexists harmoniously with existing services like your Hales.ai website and n8n. The primary concern is **port conflicts** and **Nginx configuration**.

**Current Droplet Setup (as per your Hales.ai Readme):**

  * **Hales.ai:**
      * Runs in a Docker container, typically listening on an internal port (e.g., `3000`).
      * Accessed externally via Nginx reverse proxy on standard HTTP (port 80) and HTTPS (port 443) on the `hales.ai` domain.
  * **Other Services (e.g., n8n):**
      * You've mentioned n8n is also running. It's crucial to identify the port(s) it uses. N8n typically runs on port `5678` by default, but this can be customized.

**Fire Safety Scanner (FSS) Requirements:**

  * **Frontend:** Served via Docker container on **host port `8080`** (mapped from container port 80)
  * **Backend API:** Served on **host port `8001`** (direct mapping)
  * **HTTPS Frontend:** Served on **host port `8443`** (mapped from container port 443) for SSL
  * **MongoDB:** Runs as another Docker container, typically on port `27017`. This usually runs internally within Docker and doesn't need to be exposed externally unless specifically required for database management tools.

-----

**Pre-Deployment Checklist (BEFORE Uploading FSS):**

1.  **Identify All Running Services and Their Ports:**

      * **Check Docker Processes:**
        ```bash
        docker ps
        ```
        Look for the `PORTS` column. This will show you which container ports are mapped to which host ports. Pay close attention to any services mapping to host ports `80`, `443`, `8001`, `8080`, or any other common web/application ports.
      * **Check `netstat` for Listening Ports:**
        ```bash
        sudo netstat -tulnp
        ```
        This command lists all listening TCP and UDP ports, the process ID (PID), and the program name. This is useful for identifying non-Dockerized applications. Look for `0.0.0.0:80`, `0.0.0.0:443`, and any other active listening ports. Specifically check for `5678` if n8n is running directly on the host or if its Docker container exposes that port.
      * **Examine Existing Nginx Configuration:**
        Review your main Nginx configuration file (typically `/etc/nginx/sites-available/hales.ai` or similar, linked from `/etc/nginx/sites-enabled/`) to understand how `hales.ai` is being served and if any other `server` blocks exist.

2.  **Ensure Port Availability:**

      * Based on the checks above, confirm that host ports `8001` and `8080` (or alternative high-numbered unused ports you choose for FSS) are **free and not in use** by any other service (especially Nginx, Hales.ai, or n8n). If they are, you must choose different unused ports for FSS in your `docker-compose.prod.yml` and adjust the Nginx configuration accordingly.
      * **Note for n8n:** If n8n is using its default port `5678` and you don't intend for FSS to use it, there shouldn't be a conflict. Just be aware of its presence.

3.  **Plan FSS Domain/Subdomain:**

      * Decide on the domain or subdomain for your Fire Safety Scanner (e.g., `scanner.hales.ai` or `firesafety.yourdomain.com`). You will need to configure DNS records for this new domain/subdomain to point to your droplet's IP (`134.199.239.171`) **before** Nginx can properly route traffic to it.

-----

**Detailed Deployment Steps for Fire Safety Scanner:**

**(Continue with the steps provided previously, with the following key adjustments):**

1.  **Prepare Fire Safety Scanner (Local Machine):**

      * ... (existing steps) ...
      * **Crucially, adjust `fire-safety-scanner/docker-compose.prod.yml`:**
        Make sure the `ports` mapping for your `frontend` and `backend` services inside this file use the **chosen unused host ports** (e.g., `8080` for frontend, `8001` for backend).
        Example snippet (ensure these host ports are free):
        ```yaml
        services:
          frontend:
            build:
              context: ./frontend
              dockerfile: ../Dockerfile
            ports:
              - "8080:80" # Map host port 8080 to container port 80 for FSS frontend
            environment:
              - REACT_APP_BACKEND_URL=http://backend:8001 # Internal Docker network reference
          backend:
            build:
              context: ./backend
              dockerfile: ../Dockerfile
            ports:
              - "8001:8001" # Map host port 8001 to container port 8001 for FSS backend
            environment:
              - MONGO_URL=mongodb://mongo:27017 # Internal Docker network reference
              # ... other environment variables
          mongo:
            image: mongo:latest
            volumes:
              - mongodb_data:/data/db
            # No external port mapping needed unless you specifically manage Mongo externally
        volumes:
          mongodb_data:
        ```
      * ... (existing steps) ...

2.  **Upload Fire Safety Scanner to GitHub:**

      * ... (existing steps) ...

3.  **SSH into the Digital Ocean Server:**

      * ... (existing steps) ...

4.  **Create a New Directory for Fire Safety Scanner:**

      * ... (existing steps) ...

5.  **Clone Fire Safety Scanner from GitHub:**

      * ... (existing steps) ...

6.  **Transfer the `.env` file to the server:**

      * ... (existing steps) ...

7.  **Build and Run Fire Safety Scanner Docker Containers (Internal Ports):**

    ```bash
    cd ~/projects/fire-safety-scanner
    docker-compose -f docker-compose.prod.yml up --build -d
    ```

    Verify the containers are running and their host port mappings using `docker ps`.

8.  **Configure Nginx to Proxy for Fire Safety Scanner:**

      * **Crucially, edit your *existing* Nginx configuration file** (e.g., `/etc/nginx/sites-available/hales.ai`).
      * Add a new `server` block for your FSS domain/subdomain, ensuring the `proxy_pass` directives point to the **host ports you chose** (e.g., `8080` and `8001`).
      * **Example Nginx Server Block for FSS:**
        ```nginx
        # Add this block to your existing Nginx config file (e.g., /etc/nginx/sites-available/hales.ai)
        server {
            listen 80;
            listen [::]:80;
            server_name scanner.hales.ai; # Replace with your FSS subdomain/domain

            location / {
                proxy_pass http://localhost:8080; # Points to FSS frontend container on host port 8080
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }

            location /api {
                proxy_pass http://localhost:8001; # Points to FSS backend container on host port 8001
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }

            # Optional: Add SSL configuration here if you want HTTPS for scanner.hales.ai
            # Ensure you obtain a certificate for scanner.hales.ai with certbot AFTER
            # this server block is in place and Nginx is restarted.
            # listen 443 ssl;
            # listen [::]:443 ssl;
            # ssl_certificate /etc/letsencrypt/live/scanner.hales.ai/fullchain.pem;
            # ssl_certificate_key /etc/letsencrypt/live/scanner.hales.ai/privkey.pem;
            # include /etc/letsencrypt/options-ssl-nginx.conf;
            # ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
        }
        ```
      * Save and exit the Nginx configuration file.

9.  **Test Nginx Configuration and Restart Nginx:**

    ```bash
    nginx -t
    systemctl restart nginx
    ```

10. **(If using a new domain/subdomain for FSS) Obtain SSL Certificate:**

      * ... (existing steps) ...

11. **Access Your Fire Safety Scanner Application:**

      * ... (existing steps) ...

-----

This is  a clear guide to prevent conflicts when deploying to the  existing DigitalOcean droplet.
*Built with ❤️ for fire safety professionals. Stay safe, stay compliant.*
