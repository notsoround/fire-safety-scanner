# 🔥 **Fire Safety Scanner - Complete API Reference**

## 🚨 **CRITICAL SERVER ACCESS INFORMATION**

### **⚠️ Pipeline Stability Warning**
**The SSH pipeline is NOT stable.** Always use the combined command approach to avoid connection issues.

### **🔐 Server Access**
```bash
# CORRECT WAY - Use combined commands due to unstable pipeline
ssh root@134.199.239.171 "cd projects/fire-safety-scanner && [your-command]"

# EXAMPLES:
ssh root@134.199.239.171 "cd projects/fire-safety-scanner && pwd && ls -la"
ssh root@134.199.239.171 "cd projects/fire-safety-scanner && docker-compose ps"
ssh root@134.199.239.171 "cd projects/fire-safety-scanner && git status"
```

### **🌐 Production URLs**
- **Live Application**: https://scanner.hales.ai
- **API Base URL**: https://scanner.hales.ai/api
- **Server IP**: 134.199.239.171
- **Project Path**: `/root/projects/fire-safety-scanner/`

---

## 🔌 **API Endpoints Documentation**

### **Base URL**: `https://scanner.hales.ai/api`

---

## 🔐 **Authentication Endpoints**

### **1. Demo Login (Simplified Auth)**
```http
POST /api/auth/demo-login
Content-Type: application/json
```

**Description**: Simplified authentication endpoint for demo/production use.

**Request Body**: None required

**Response**:
```json
{
  "session_token": "uuid-session-token",
  "user": {
    "id": "demo-user",
    "email": "admin@firesafety.com",
    "name": "Fire Safety Admin",
    "picture": "https://via.placeholder.com/150"
  }
}
```

**Example**:
```bash
curl -X POST https://scanner.hales.ai/api/auth/demo-login
```

---

### **2. Create Session (External Auth)**
```http
POST /api/auth/session
Content-Type: application/x-www-form-urlencoded
```

**Description**: Creates session from external authentication provider.

**Request Body**:
```
session_id=external-session-id
```

**Response**: Same as demo-login

---

### **3. Get User Profile**
```http
GET /api/auth/profile
Session-Token: your-session-token
```

**Description**: Retrieves current user profile information.

**Response**:
```json
{
  "id": "demo-user",
  "email": "admin@firesafety.com",
  "name": "Fire Safety Admin",
  "picture": "https://via.placeholder.com/150"
}
```

---

## 🔍 **Inspection Endpoints**

### **1. Create New Inspection**
```http
POST /api/inspections
Content-Type: application/json
Session-Token: your-session-token
```

**Description**: Analyzes fire extinguisher image using AI and creates inspection record.

**Request Body**:
```json
{
  "image_base64": "base64-encoded-image-data",
  "location": "Building A - Floor 2",
  "notes": "Optional additional notes"
}
```

**Response**:
```json
{
  "id": "inspection-uuid",
  "user_id": "demo-user",
  "location": "Building A - Floor 2",
  "inspection_date": "2025-01-27T02:00:00Z",
  "status": "analyzed",
  "analysis": {
    "last_inspection_date": {
      "year": 2024,
      "month": 12,
      "day": 15,
      "extracted_text": "Year: 2024, Month: 12, Day: 15"
    },
    "next_due_date": {
      "year": 2025,
      "month": 12,
      "day": 15
    },
    "extinguisher_type": "ABC Dry Chemical",
    "condition": "Good",
    "requires_attention": false,
    "maintenance_notes": "",
    "confidence_score": 0.85
  },
  "message": "Inspection completed successfully"
}
```

**Example**:
```bash
curl -X POST https://scanner.hales.ai/api/inspections \
  -H "Content-Type: application/json" \
  -H "Session-Token: your-token" \
  -d '{
    "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "location": "Main Building - Lobby",
    "notes": "Monthly inspection"
  }'
```

---

### **2. Get All Inspections**
```http
GET /api/inspections
Session-Token: your-session-token
```

**Description**: Retrieves all inspection records for the current user.

**Response**:
```json
[
  {
    "id": "inspection-uuid",
    "user_id": "demo-user",
    "location": "Building A - Floor 2",
    "image_base64": "base64-image-data",
    "inspection_date": "2025-01-27T02:00:00Z",
    "due_date": "2025-12-15T00:00:00Z",
    "status": "analyzed",
    "gemini_response": {
      "last_inspection_date": {...},
      "next_due_date": {...},
      "extinguisher_type": "ABC Dry Chemical",
      "condition": "Good",
      "requires_attention": false
    },
    "notes": "Monthly inspection",
    "created_at": "2025-01-27T02:00:00Z",
    "updated_at": "2025-01-27T02:00:00Z"
  }
]
```

---

### **3. Update Inspection**
```http
PUT /api/inspections/{inspection_id}
Content-Type: application/json
Session-Token: your-session-token
```

**Description**: Updates inspection data with manual corrections.

**Request Body**:
```json
{
  "last_inspection_date": {
    "year": 2024,
    "month": 12,
    "day": 20
  },
  "next_due_date": {
    "year": 2025,
    "month": 12,
    "day": 20
  },
  "extinguisher_type": "ABC Dry Chemical",
  "maintenance_notes": "Pressure gauge checked",
  "condition": "Good",
  "requires_attention": false,
  "location": "Updated location",
  "notes": "Updated notes"
}
```

**Response**:
```json
{
  "message": "Inspection updated successfully"
}
```

---

### **4. Get Due Inspections**
```http
GET /api/inspections/due
Session-Token: your-session-token
```

**Description**: Retrieves inspections due within the next 30 days.

**Response**: Array of inspection objects (same format as Get All Inspections)

---

### **5. Delete Inspection**
```http
DELETE /api/inspections/{inspection_id}
Session-Token: your-session-token
```

**Description**: Deletes an inspection record.

**Response**:
```json
{
  "message": "Inspection deleted successfully"
}
```

---

## 🏥 **Utility Endpoints**

### **Health Check**
```http
GET /api/health
```

**Description**: System health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T02:00:00Z"
}
```

---

## 💾 **Database Schema**

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
  gemini_response: "{JSON with AI analysis results}",
  notes: "Additional user notes",
  created_at: ISODate,
  updated_at: ISODate
}
```

### **Sessions Collection**
```javascript
{
  session_id: "external-session-id",
  user_id: "user-uuid", 
  session_token: "internal-session-token",
  expires_at: ISODate,
  created_at: ISODate
}
```

---

## 🔧 **Development & Deployment**

### **Environment Variables**
```bash
# MongoDB
MONGO_URL="mongodb://mongo:27017"
DB_NAME="production_database"

# Frontend
REACT_APP_BACKEND_URL="https://scanner.hales.ai"

# AI Integration
OPENROUTER_API_KEY="your-openrouter-api-key"
N8N_WEBHOOK_URL="your-n8n-webhook-url"
```

### **Docker Commands (Server)**
```bash
# Check running containers
ssh root@134.199.239.171 "cd projects/fire-safety-scanner && docker-compose ps"

# View logs
ssh root@134.199.239.171 "cd projects/fire-safety-scanner && docker-compose logs -f"

# Restart services
ssh root@134.199.239.171 "cd projects/fire-safety-scanner && docker-compose restart"

# Deploy changes
ssh root@134.199.239.171 "cd projects/fire-safety-scanner && git pull && docker-compose up -d --build"
```

### **Database Access**
```bash
# Connect to MongoDB
ssh root@134.199.239.171 "cd projects/fire-safety-scanner && docker-compose exec mongo mongosh production_database"

# View collections
ssh root@134.199.239.171 "cd projects/fire-safety-scanner && docker-compose exec mongo mongosh production_database --eval 'show collections'"

# Count inspections
ssh root@134.199.239.171 "cd projects/fire-safety-scanner && docker-compose exec mongo mongosh production_database --eval 'db.inspections.countDocuments()'"
```

---

## 🚨 **Error Handling**

### **Common HTTP Status Codes**
- `200` - Success
- `400` - Bad Request (invalid data)
- `401` - Unauthorized (invalid session)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

### **Error Response Format**
```json
{
  "detail": "Error message description"
}
```

---

## 🔐 **Authentication Notes**

### **Current Implementation**
- **Demo Mode**: Authentication is bypassed for production demo
- **Session Token**: Required in `Session-Token` header for most endpoints
- **User Context**: All operations use demo user (`demo-user`)

### **Session Management**
- Sessions expire after 30 days (demo login)
- Session tokens are UUIDs
- No refresh token mechanism currently implemented

---

## 🧪 **Testing Examples**

### **Complete Workflow Test**
```bash
# 1. Login
TOKEN=$(curl -s -X POST https://scanner.hales.ai/api/auth/demo-login | jq -r '.session_token')

# 2. Check health
curl -s https://scanner.hales.ai/api/health

# 3. Get existing inspections
curl -s -H "Session-Token: $TOKEN" https://scanner.hales.ai/api/inspections

# 4. Get due inspections
curl -s -H "Session-Token: $TOKEN" https://scanner.hales.ai/api/inspections/due

# 5. Get user profile
curl -s -H "Session-Token: $TOKEN" https://scanner.hales.ai/api/auth/profile
```

---

## 📊 **Performance Notes**

### **AI Analysis**
- **Model**: Gemini 2.5 Pro via OpenRouter
- **Average Response Time**: 3-8 seconds
- **Image Size Limit**: Recommended max 5MB
- **Supported Formats**: JPEG, PNG

### **Database**
- **MongoDB**: Single instance
- **Collections**: Users, Sessions, Inspections
- **Indexing**: Basic indexes on user_id and dates

---

## 🔄 **Pipeline Stability Issues**

### **Known Issues**
1. **SSH Pipeline Instability**: Direct SSH connections may drop
2. **Solution**: Always use combined commands with `&&`
3. **File Transfer**: Use `scp` or `rsync` for file operations
4. **Long Operations**: May require multiple command executions

### **Best Practices**
```bash
# ✅ GOOD - Combined command
ssh root@134.199.239.171 "cd projects/fire-safety-scanner && docker-compose ps && git status"

# ❌ BAD - Separate commands (pipeline may break)
ssh root@134.199.239.171
cd projects/fire-safety-scanner
docker-compose ps
```

---

**🎯 This API powers the live Fire Safety Scanner application at https://scanner.hales.ai**