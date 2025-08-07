# 🔥 Fire Safety Scanner - Redirect Loop Fix Deployment

## Quick Fix Deployment Steps

### Option 1: Automated Script (Recommended)

1. **SSH into your DigitalOcean droplet:**
   ```bash
   ssh root@134.199.239.171
   ```

2. **Navigate to the fire-safety-scanner directory:**
   ```bash
   cd ~/projects/fire-safety-scanner
   ```

3. **Update the docker-compose.prod.yml file:**
   ```bash
   # Edit the file to change line 20
   nano docker-compose.prod.yml
   
   # Change this line:
   # - ./docker/nginx-ssl.conf:/etc/nginx/sites-available/default
   # To this:
   # - ./docker/nginx.conf:/etc/nginx/sites-available/default
   ```

4. **Run the fix deployment script:**
   ```bash
   ./fix-redirect-deploy.sh
   ```

### Option 2: Manual Steps

1. **SSH into your DigitalOcean droplet:**
   ```bash
   ssh root@134.199.239.171
   ```

2. **Navigate to project directory:**
   ```bash
   cd ~/projects/fire-safety-scanner
   ```

3. **Stop existing containers:**
   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

4. **Edit docker-compose.prod.yml:**
   ```bash
   nano docker-compose.prod.yml
   ```
   
   **Change line 20 from:**
   ```yaml
   - ./docker/nginx-ssl.conf:/etc/nginx/sites-available/default
   ```
   
   **To:**
   ```yaml
   - ./docker/nginx.conf:/etc/nginx/sites-available/default
   ```

5. **Rebuild and start containers:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

6. **Wait for services to start:**
   ```bash
   sleep 30
   ```

## Testing the Fix

### 1. Test Docker Container (should return HTML, not 301):
```bash
curl -I http://localhost:8080/
```
**Expected:** `HTTP/1.1 200 OK` with `Content-Type: text/html`
**Not:** `HTTP/1.1 301 Moved Permanently`

### 2. Test Backend API:
```bash
curl http://localhost:8001/api/health
```
**Expected:** `{"status": "healthy"}`

### 3. Test Frontend via System Nginx:
```bash
curl -I https://scanner.hales.ai/
```
**Expected:** `HTTP/2 200` with HTML content

### 4. Test API via System Nginx:
```bash
curl https://scanner.hales.ai/api/health
```
**Expected:** `{"status": "healthy"}`

## Verification Steps

1. **Check running containers:**
   ```bash
   docker ps
   ```
   Should show fire-safety-scanner containers running

2. **Check container logs:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

3. **Test the website:**
   - Open https://scanner.hales.ai/ in browser
   - Should load the Fire Safety Scanner interface
   - No infinite redirect loop

## What This Fix Does

- **Problem:** Docker container was using `nginx-ssl.conf` which has `return 301 https://$server_name$request_uri;` causing infinite redirects
- **Solution:** Changed to use `nginx.conf` which properly serves the React app from `/app/frontend/build`
- **Result:** System nginx (port 443) → Docker container (port 8080) → React app (no more redirects)

## Troubleshooting

If the fix doesn't work:

1. **Check nginx configs:**
   ```bash
   # System nginx config
   cat /etc/nginx/sites-available/fire-safety-scanner
   
   # Docker container nginx config (should be nginx.conf content)
   docker exec -it $(docker ps -q --filter "name=fire-safety-scanner") cat /etc/nginx/sites-available/default
   ```

2. **Restart system nginx:**
   ```bash
   systemctl restart nginx
   ```

3. **Check system nginx status:**
   ```bash
   systemctl status nginx
   ```

## Success Indicators

✅ `curl http://localhost:8080/` returns HTML (not 301)
✅ `curl https://scanner.hales.ai/` loads the frontend
✅ `curl https://scanner.hales.ai/api/health` returns backend health status
✅ No infinite redirect loop in browser

---
*This fix resolves the infinite redirect loop by ensuring the Docker container serves the React app instead of redirecting.*