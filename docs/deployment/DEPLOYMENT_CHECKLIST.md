# 🚀 Fire Safety Scanner - Deployment Checklist

## Pre-Deployment Checklist

### Environment Configuration
- [ ] `.env.prod` file exists with production API keys
- [ ] OpenRouter API key is valid (not placeholder)
- [ ] N8N webhook URL is accessible
- [ ] Backend URL points to production domain
- [ ] SSL certificates are current and valid

### Code & Dependencies
- [ ] Latest code committed to GitHub
- [ ] All dependencies updated in `requirements.txt`
- [ ] Frontend build tested locally
- [ ] Camera functionality tested in HTTPS environment
- [ ] No console errors in browser

### Infrastructure
- [ ] Digital Ocean droplet accessible
- [ ] Docker and Docker Compose installed
- [ ] Domain DNS pointing to droplet IP
- [ ] SSL certificates configured
- [ ] Firewall rules allow ports 80, 443, 8001

### Backup & Safety
- [ ] Current production environment backed up
- [ ] Database backup completed
- [ ] Rollback plan prepared
- [ ] Deployment scripts tested

## Deployment Steps

### 1. Local Testing
```bash
# Test current setup locally
./switch-env.sh dev
./validate-deployment.sh
```

### 2. Production Deployment
```bash
# SSH to production server
ssh root@134.199.239.171

# Navigate to project directory
cd ~/projects/fire-safety-scanner

# Pull latest changes
git pull origin main

# Deploy with enhanced script
./deploy-production.sh
```

### 3. Post-Deployment Validation
```bash
# Run validation on server
./validate-deployment.sh

# Test from external location
curl -I https://scanner.hales.ai/
curl https://scanner.hales.ai/api/health
```

## Camera Feature Testing

### Local HTTPS Testing
- [ ] Camera permissions granted
- [ ] Fire extinguisher tag shape displays
- [ ] Image capture works correctly
- [ ] Captured images process properly

### Production HTTPS Testing
- [ ] Camera works over HTTPS
- [ ] No browser security warnings
- [ ] Cross-browser compatibility verified
- [ ] Mobile device testing completed

## Troubleshooting Quick Reference

### Common Issues
1. **Redirect Loop**: Use `nginx.conf` instead of `nginx-ssl.conf` in container
2. **Camera Not Working**: Check HTTPS, browser permissions, console errors
3. **API Errors**: Verify API keys, check backend logs
4. **SSL Issues**: Check certificate paths, renewal status

### Emergency Rollback
```bash
# If deployment fails, rollback using backup
cd ~/projects/fire-safety-scanner
tar -xzf backups/production-backup-[TIMESTAMP].tar.gz
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## Success Criteria

### Functional Requirements
- [ ] Website loads at https://scanner.hales.ai
- [ ] User can take photos with camera
- [ ] Fire extinguisher tag shape works
- [ ] Image analysis processes correctly
- [ ] Data saves to database
- [ ] No infinite redirects or errors

### Performance Requirements
- [ ] Page load time < 3 seconds
- [ ] Camera initialization < 2 seconds
- [ ] API response time < 1 second
- [ ] No memory leaks in browser

### Security Requirements
- [ ] HTTPS enforced (no HTTP access)
- [ ] API keys not exposed in frontend
- [ ] Database access restricted
- [ ] No sensitive data in logs

## Post-Deployment Monitoring

### Health Checks (First 24 Hours)
- [ ] Monitor container logs for errors
- [ ] Check API response times
- [ ] Verify database connections stable
- [ ] Monitor SSL certificate status
- [ ] Test camera functionality periodically

### Weekly Maintenance
- [ ] Review application logs
- [ ] Check disk space usage
- [ ] Verify backup procedures
- [ ] Test rollback procedures
- [ ] Update dependencies if needed

---

**Deployment Engineer:** _[Your Name]_  
**Date:** _[Deployment Date]_  
**Version:** _[Git Commit Hash]_  
**Notes:** _[Any special considerations]_