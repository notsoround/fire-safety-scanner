# 🔀 **Version Management & Branch Strategy**

**Created**: August 15, 2025  
**Purpose**: Track different versions and experimental branches  
**Strategy**: Tag stable states + Feature branches for experimentation  

---

## 📋 **Current Version Status**

### **🏷️ Stable Tags**
| Tag | Date | Description | Git Command |
|-----|------|-------------|-------------|
| `backup-aug-15-2025` | Aug 15, 2025 | Pre-improvements stable state | `git checkout backup-aug-15-2025` |

### **🌿 Active Branches**
| Branch | Purpose | Status | Deployment |
|--------|---------|--------|------------|
| `main` | Production stable | ✅ Live | https://scanner.hales.ai |
| `clean-dark-theme` | UI theme experiments | 🔄 Development | Can deploy for testing |

---

## 🚀 **Git Commands Reference**

### **Create Backup Tag (DO THIS FIRST)**
```bash
# Navigate to project
cd "/Users/halesai/VSC Projects/fire-safety-scanner-main"

# Tag current stable state
git add .
git commit -m "Pre-improvement backup - August 15, 2025 - stable state before dark theme experiment"
git tag "backup-aug-15-2025"
git push origin main
git push origin --tags
```

### **Create & Switch to Experimental Branch**
```bash
# Create experimental branch for dark theme
git checkout -b clean-dark-theme
git push -u origin clean-dark-theme
```

### **Deploy Experimental Branch for Testing**
```bash
# Deploy experimental branch to test server
ssh root@134.199.239.171 "cd projects/fire-safety-scanner && git fetch && git checkout clean-dark-theme && docker-compose -f docker-compose.prod.yml up -d --build app"
```

### **Switch Back to Main (if needed)**
```bash
git checkout main
```

### **Revert to Safe State (emergency)**
```bash
# Go back to stable backup
git checkout backup-aug-15-2025
# Or reset main to backup
git reset --hard backup-aug-15-2025
```

---

## 🎯 **Planned Improvements (Clean Dark Theme Branch)**

### **Phase 1: UI Theme Updates**
- [ ] Replace purple gradient with black + opacity
- [ ] Maintain background image visibility
- [ ] Professional dark theme implementation
- [ ] Test on mobile and desktop

### **Phase 2: Functionality Fixes**
- [ ] Add Google Places API key: `AIzaSyD6fCpa-GGGj-hfN49zEkLdUso05HEQX-E`
- [ ] Fix business suggestions on both Quick Shot and Technician modes
- [ ] Add login button to mobile hamburger menu
- [ ] Convert condition dropdown to flexible notes field

### **Phase 3: Smart Features**
- [ ] Detect non-fire-extinguisher images
- [ ] Enhanced notes with AI suggestions
- [ ] Business suggestions for Technician mode

---

## 📊 **Testing Strategy**

### **Deployment Testing**
1. **Deploy experimental branch** to test server
2. **Test all features** on mobile and desktop
3. **Verify improvements** work in production environment
4. **Document any issues** for fixes

### **Rollback Plan**
- If experimental branch has issues → `git checkout main`
- If main gets corrupted → `git checkout backup-aug-15-2025`
- Emergency reset → Use backup tag to restore

---

## 🧠 **IMPORTANT REMINDERS FOR MATT**

### **🔴 DON'T FORGET:**
1. **Current stable version** is tagged as `backup-aug-15-2025`
2. **Experimental work** happens on `clean-dark-theme` branch
3. **Can deploy experimental** for testing anytime
4. **Main branch** is your production safety net
5. **Google Places API Key**: `AIzaSyD6fCpa-GGGj-hfN49zEkLdUso05HEQX-E`

### **🟢 QUICK COMMANDS:**
- Switch to experimental: `git checkout clean-dark-theme`
- Back to stable: `git checkout main`
- Deploy experimental: `ssh root@134.199.239.171 "cd projects/fire-safety-scanner && git checkout clean-dark-theme && docker-compose -f docker-compose.prod.yml up -d --build app"`
- Back to production: `ssh root@134.199.239.171 "cd projects/fire-safety-scanner && git checkout main && docker-compose -f docker-compose.prod.yml up -d --build app"`

---

## 📝 **Development Log**

### **August 15, 2025**
- ✅ Created version management strategy
- ⏳ Backup tag creation (awaiting git commands)
- ⏳ Experimental branch setup
- ⏳ Dark theme implementation

---

**💡 This document serves as your memory aid - bookmark it!**

*Last Updated: August 15, 2025*
