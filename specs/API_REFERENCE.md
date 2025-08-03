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