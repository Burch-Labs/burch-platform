# Burch Platform - Hostgator Deployment Guide

## ⚠️ Important: Hostgator Limitations

**Shared Hosting Issue:** Hostgator shared hosting does NOT support Node.js runtime by default. This means:
- ❌ Dynamic API routes won't work (`/api/payments/initiate`, etc.)
- ❌ Payment webhooks can't receive callbacks
- ✅ Static pages and forms will display
- ✅ Payment initiation will fail (need API elsewhere)

## ✅ Recommended Solution: Hybrid Deployment

### Option A: Hostgator Frontend + Vercel/Railway API (Recommended)
- Static HTML on Hostgator (cheap domain)
- API on Vercel/Railway (handles payments)
- CORS configured for cross-origin requests

### Option B: Hostgator with Node.js VPS ($20+/month)
- Request cPanel to enable Node.js
- Or upgrade to Hostgator VPS with Node.js support
- Full functionality works

### Option C: Static Export Only (Limited)
- Export Next.js to static HTML
- Display checkout form only
- Can't process payments

---

## 🚀 RECOMMENDED: Hybrid Deployment (Option A)

### Step 1: Deploy API to Vercel (10 minutes)

1. Go to: https://vercel.com/new
2. Connect burch-platform repo
3. Add environment variables (payment keys)
4. Deploy → Get URL like `https://api-burch.vercel.app`

### Step 2: Build Static Frontend

```bash
cd /home/user/burch-platform

# Build Next.js
npm run build

# Export to static HTML
npm run export

# This creates 'out' directory with static files
```

### Step 3: Upload to Hostgator

#### Get FTP Credentials:
1. Log in to Hostgator cPanel
2. Go to: Files → FTP Accounts
3. Note: Username, Password, Host
4. Or use default: `ftp.yourdomain.com`

#### Install FTP Client:
- **Windows:** FileZilla (free)
- **Mac:** Transmit or Cyberduck (free)
- **Linux:** `apt install lftp`

#### Connect & Upload:

**Using FileZilla:**
1. Host: `ftp.yourdomain.com`
2. Username: Your cPanel username
3. Password: Your cPanel password
4. Port: 21
5. Connect
6. Navigate to: `public_html`
7. Upload all files from `out/` folder

**Using Terminal (Linux/Mac):**
```bash
cd /home/user/burch-platform/out

# Upload all files
lftp -u username,password ftp.yourdomain.com << EOF
cd public_html
mirror -R .
quit
EOF
```

### Step 4: Configure .htaccess

Create `.htaccess` file in `public_html/`:

```apache
# Enable rewrite engine
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Remove .html extension
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)\.html$ $1 [L,R=301]
  
  # Route all requests through index.html
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ index.html [L]
  
  # CORS headers
  SetEnvIf Origin "^(http(s)?://(.+\.)?(yourdomain\.com|localhost|vercel\.app))?$" ACAO=$0
  Header append Access-Control-Allow-Origin %{ACAO}e env=ACAO
  Header merge Vary Origin
</IfModule>
```

### Step 5: Update API Endpoints

Create `.env.local` in Hostgator root:

```
NEXT_PUBLIC_API_URL=https://api-burch.vercel.app
```

Or hardcode in checkout component:

**apps/web/src/components/checkout/CheckoutFlow.tsx:**
```typescript
const API_URL = typeof window !== 'undefined' ? 
  (process.env.NEXT_PUBLIC_API_URL || 'https://api-burch.vercel.app') : 
  'https://api-burch.vercel.app';

// Then use:
const response = await fetch(`${API_URL}/api/payments/initiate`, {...})
```

### Step 6: Test

1. Visit: `https://yourdomain.com`
2. Click "Checkout"
3. Fill form
4. Select payment method
5. Click "Complete Booking"
6. Should redirect to Vercel API
7. Payment should process normally

---

## 🔧 ALTERNATIVE: Hostgator VPS with Node.js

If you want everything on Hostgator:

### Step 1: Upgrade to VPS
- Contact Hostgator support
- Request upgrade to VPS with Node.js support
- Cost: $20-30/month (vs $2.99 shared)

### Step 2: Install Node.js

```bash
# SSH into Hostgator VPS
ssh user@yourdomain.com

# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 18+
nvm install 18
nvm use 18

# Verify
node --version  # Should be v18+
npm --version   # Should be 9+
```

### Step 3: Deploy Application

```bash
# Clone repository
git clone https://github.com/Burch-Labs/burch-platform.git
cd burch-platform

# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma client
npm run db:generate

# Build
npm run build

# Create .env
cat > .env << EOF
DATABASE_URL=mysql://user:pass@localhost/burch
NEXTAUTH_SECRET=[random-32-char-string]
NEXTAUTH_URL=https://yourdomain.com
MPESA_ENV=production
MPESA_CONSUMER_KEY=your_key
[... other variables]
EOF

# Start server
npm run start
```

### Step 4: Setup Process Manager

```bash
# Install PM2 (keeps app running)
npm install -g pm2

# Start application
pm2 start npm --name "burch" -- start

# Enable auto-restart
pm2 startup
pm2 save
```

### Step 5: Configure Domain

In Hostgator cPanel:
1. Point domain to VPS IP
2. Configure reverse proxy to Node.js port (3000)
3. Or use Apache ProxyPass

```apache
ProxyPreserveHost On
ProxyPass / http://localhost:3000/
ProxyPassReverse / http://localhost:3000/
```

---

## 📊 Comparison: Which Option?

| Feature | Hybrid (A) | VPS (B) | Static (C) |
|---------|-----------|--------|-----------|
| Cost | $2.99+pay-for-api | $20/mo | $2.99/mo |
| Setup Time | 20 min | 45 min | 5 min |
| Payment Processing | ✅ Works | ✅ Works | ❌ No |
| Webhooks | ✅ Works | ✅ Works | ❌ No |
| Dynamic APIs | ✅ Works | ✅ Works | ❌ No |
| Guest Details Form | ✅ Works | ✅ Works | ✅ Works |
| Display Only | ✅ Works | ✅ Works | ✅ Works |
| Best For | Production | Full control | Demo only |

**RECOMMENDED:** Option A (Hybrid) - Best balance of cost and functionality

---

## 🛠️ Step-by-Step Hybrid Deployment (Detailed)

### Phase 1: Deploy API to Vercel (10 min)

```bash
# Step 1: Prepare API-only deployment
cd /home/user/burch-platform

# Step 2: Go to Vercel
# URL: https://vercel.com/new

# Step 3: Connect GitHub → Select burch-platform
# Step 4: Set root directory: apps/web
# Step 5: Add environment variables:
#   - DATABASE_URL
#   - All payment provider keys
#   - NEXTAUTH_SECRET
# Step 6: Deploy

# After deploy, note your URL:
# https://burch-api-xxxxx.vercel.app
```

### Phase 2: Build Static Frontend (5 min)

```bash
# Build Next.js
cd /home/user/burch-platform
npm run build

# Export to static HTML
# (Note: This requires next.config.js update for static export)
```

**Update next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  // Disable features that require server
  experimental: {
    isrMemoryCacheSize: 0,
  },
};

module.exports = nextConfig;
```

Then:
```bash
npm run build  # Creates 'out' directory
```

### Phase 3: Upload to Hostgator (5 min)

**Using FileZilla:**
```
1. Download FileZilla: https://filezilla-project.org
2. Host: ftp.yourdomain.com
3. Username: cPanel username
4. Password: cPanel password
5. Port: 21
6. Connection: Upload 'out' folder contents to 'public_html'
```

**Using Terminal:**
```bash
cd out

# Upload via lftp
lftp -u cpaneluser ftp.yourdomain.com << EOF
cd public_html
mirror -R .
quit
EOF
```

### Phase 4: Configure Routing (5 min)

**Upload .htaccess to public_html:**
```bash
# Via FTP or cPanel File Manager
# Create file: .htaccess

# Content:
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ index.html [L]
</IfModule>
```

---

## 🔐 Security Setup

### 1. CORS Configuration
Add to checkout component:

```typescript
const API_URL = 'https://burch-api-xxxxx.vercel.app';

// CORS will be handled by Vercel
```

### 2. SSL Certificate
Hostgator provides free AutoSSL:
1. cPanel → SSL/TLS
2. Enable AutoSSL
3. Certificate auto-renews yearly

### 3. Payment Keys
Store in Vercel environment variables ONLY:
- ❌ Never in Hostgator files
- ❌ Never in .env files
- ✅ Always in platform env vars

---

## 📊 File Structure on Hostgator

```
public_html/
├── index.html          (homepage)
├── checkout/
│   └── index.html      (checkout page)
├── _next/              (Next.js build files)
├── images/             (static images)
├── .htaccess           (routing)
└── favicon.ico
```

---

## ✅ Testing After Hostgator Upload

### 1. Test Home Page
```bash
curl https://yourdomain.com
# Should return HTML content
```

### 2. Test Checkout Page
```bash
curl https://yourdomain.com/checkout
# Should show checkout form
```

### 3. Test Payment API Call
```bash
# This should go to Vercel
curl -X POST https://api-burch-xxxxx.vercel.app/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### 4. Test in Browser
1. Visit: `https://yourdomain.com`
2. Click "Checkout"
3. Fill form with test data
4. Select payment method
5. Click "Complete Booking"
6. Should redirect to Vercel API
7. Payment should process

---

## 🆘 Troubleshooting

### Page shows 404 error
**Issue:** .htaccess not configured
**Fix:** Upload .htaccess file with rewrite rules

### API call returns CORS error
**Issue:** Cross-origin request blocked
**Fix:** 
1. Ensure Vercel has CORS enabled
2. Add to Vercel API response headers:
   ```
   Access-Control-Allow-Origin: https://yourdomain.com
   ```

### Images not loading
**Issue:** Image paths incorrect
**Fix:** Check image paths are relative, not absolute

### Payment not processing
**Issue:** API URL not set correctly
**Fix:** 
1. Verify Vercel API URL
2. Check NEXT_PUBLIC_API_URL env var
3. Test API directly: `curl https://api-url/api/health`

### Form submission fails silently
**Issue:** JavaScript error
**Fix:**
1. Open browser console (F12)
2. Check for errors
3. Verify API endpoint accessible
4. Check CORS headers

---

## 🚀 Deployment Checklist

- [ ] Deploy API to Vercel
- [ ] Get Vercel API URL
- [ ] Build static Next.js
- [ ] Get Hostgator FTP credentials
- [ ] Upload 'out' folder to public_html
- [ ] Upload .htaccess file
- [ ] Enable AutoSSL in cPanel
- [ ] Update DNS if needed
- [ ] Test checkout page
- [ ] Test payment flow
- [ ] Monitor Vercel logs
- [ ] Monitor Hostgator error logs

---

## 📞 Support

**Hostgator Issues:**
- cPanel: https://cpanel.hostgator.com
- Support: https://support.hostgator.com
- FTP Issues: Check username/password in cPanel → FTP Accounts

**Vercel Issues:**
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support

**Burch Platform:**
- Check: DEPLOYMENT_GUIDE.md
- Check: TESTING_AND_DEPLOYMENT.md

---

## 💡 Pro Tips

1. **Use ngrok for webhook testing locally:**
   ```bash
   npx ngrok http 5000
   # Use ngrok URL in payment provider webhooks
   ```

2. **Monitor Vercel logs:**
   ```
   Vercel Dashboard → Deployments → [your-deployment] → Logs
   ```

3. **Test API before deploying:**
   ```bash
   curl https://api-url/api/health
   # Should return {"status":"ok"}
   ```

4. **Keep backups:**
   - Download public_html via FTP regularly
   - Export database from Vercel PostgreSQL

---

## 📈 Performance Optimization

1. **Enable caching in .htaccess:**
   ```apache
   <IfModule mod_expires.c>
     ExpiresActive On
     ExpiresByType image/jpeg "access plus 1 year"
     ExpiresByType image/gif "access plus 1 year"
     ExpiresByType text/css "access plus 1 month"
   </IfModule>
   ```

2. **Enable GZIP compression:**
   ```apache
   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/html text/plain text/xml
   </IfModule>
   ```

3. **Use CDN for images:**
   ```
   Use Vercel's built-in image optimization
   Or configure Cloudflare (free)
   ```

---

**Ready to deploy to Hostgator? Follow the Hybrid Deployment (Option A) steps above!**

**Estimated Total Time: 20-25 minutes**

Last Updated: August 15, 2026
