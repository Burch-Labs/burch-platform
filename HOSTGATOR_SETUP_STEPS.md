# Hostgator Deployment - Step-by-Step Instructions

## ⚠️ Pre-Deployment Check

**For Payment Processing to Work:**
- [ ] API deployed to Vercel (or Railway)
- [ ] Vercel API URL available (e.g., `https://api-burch-xxxxx.vercel.app`)
- [ ] Payment provider keys configured in Vercel
- [ ] Hostgator domain purchased
- [ ] FTP access enabled in Hostgator
- [ ] Node.js 18+ installed locally

---

## 🚀 OPTION 1: Automated Deployment (Recommended)

### Prerequisites
- Linux/Mac terminal or Windows Git Bash
- lftp installed (`brew install lftp` on Mac, `apt install lftp` on Linux)
- FTP credentials from Hostgator

### Step-by-Step

**Step 1: Get Hostgator FTP Credentials**

1. Log in to Hostgator cPanel: https://cpanel.hostgator.com
2. Navigate to: **Files → FTP Accounts**
3. Find your main FTP account or create one
4. Note down:
   - **FTP Host:** `ftp.yourdomain.com`
   - **FTP Username:** Your cPanel username
   - **FTP Password:** Your cPanel password
   - **FTP Port:** 21 (default)

**Step 2: Run Deployment Script**

```bash
cd /home/user/burch-platform

# Run the automated deployment script
./scripts/deploy-hostgator.sh ftp.yourdomain.com cpaneluser password123
```

Replace:
- `ftp.yourdomain.com` with your FTP host
- `cpaneluser` with your FTP username
- `password123` with your FTP password

**Expected Output:**
```
🚀 Burch Platform - Hostgator Deployment
========================================

1️⃣  Building Next.js application...
✅ Build complete

2️⃣  Preparing deployment files...
✅ Deployment package ready

3️⃣  Uploading files to Hostgator...
✅ Upload complete!

4️⃣  Cleaning up...
✅ Cleanup complete

🎉 Deployment Successful!
```

**Step 3: Configure on Hostgator**

1. Log in to cPanel
2. Go to: **Settings → Environment Variables**
3. Add variable:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://api-burch-xxxxx.vercel.app`
   - **Click:** Add

**Step 4: Test**

Visit: `https://yourdomain.com/checkout`

---

## 🖱️ OPTION 2: Manual FTP Upload (No Script)

### Step 1: Build Locally

```bash
cd /home/user/burch-platform/apps/web
npm run build
```

Creates `.next/` folder with all build files.

### Step 2: Download & Install FTP Client

**Windows:** 
- FileZilla: https://filezilla-project.org/download.php
- WinSCP: https://winscp.net/eng/download.php

**Mac:**
- Cyberduck: https://cyberduck.io
- Transmit: https://www.panic.com/transmit

**Linux:**
```bash
sudo apt install filezilla  # Debian/Ubuntu
sudo yum install filezilla  # CentOS
```

### Step 3: Connect via FTP

**Open FTP Client → New Connection:**

| Field | Value |
|-------|-------|
| Host | `ftp.yourdomain.com` |
| Username | Your cPanel username |
| Password | Your cPanel password |
| Port | 21 |
| Protocol | FTP |

Click **Connect**

### Step 4: Navigate to Web Root

Path: `/public_html` (or `public_html/` depending on FTP client)

### Step 5: Upload Files

**Option A: Upload entire .next folder**
1. In FTP client, navigate to `/home/user/burch-platform/apps/web/.next` locally
2. In remote (Hostgator), navigate to `/public_html`
3. Drag & drop `.next` folder
4. Wait for upload to complete (5-10 minutes)

**Option B: Upload specific folders**

From your local `.next/` folder, upload:
```
.next/
├── server/
├── static/
└── standalone/
```

### Step 6: Upload .htaccess

1. **Locally:** Find `.htaccess.hostgator` in repository root
2. **Right-click → Rename to:** `.htaccess`
3. **Upload to:** `/public_html/`

### Step 7: Upload Environment Config (Optional)

Create file: `.env.local`

Content:
```
NEXT_PUBLIC_API_URL=https://api-burch-xxxxx.vercel.app
```

Upload to `/public_html/`

### Step 8: Set Permissions

In FTP client or cPanel:
1. Right-click `.htaccess` → Properties
2. Set permissions: `644` (read/write for owner, read for others)
3. Right-click `.next` → Properties
4. Set permissions: `755` (for directories)

### Step 9: Test

Open browser: `https://yourdomain.com/checkout`

Should see checkout form.

---

## ✅ Post-Deployment Configuration

### 1. Enable HTTPS/SSL

1. Log in to cPanel
2. Go to: **SSL/TLS → AutoSSL**
3. Click: **Check and install**
4. Wait 5-10 minutes
5. Certificate auto-installs

### 2. Set Up Environment Variables

**Method 1: cPanel Environment Variables**
1. cPanel → Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_API_URL` = `https://api-burch-xxxxx.vercel.app`
   - Save

**Method 2: .env.local File**
```
NEXT_PUBLIC_API_URL=https://api-burch-xxxxx.vercel.app
```
Upload via FTP to `/public_html/`

### 3. Configure Payment API URL

Edit `.next/server/app/api/payments/initiate/route.js` and update:
```javascript
const API_URL = 'https://api-burch-xxxxx.vercel.app';
```

Or use environment variable approach (Method 2 above).

### 4. Enable Caching (Optional but Recommended)

cPanel → **Cache Manager → Clear All Caches**

Then refresh browser: `Ctrl+Shift+Del` (Windows) or `Cmd+Shift+Del` (Mac)

---

## 🧪 Testing Checklist

- [ ] Visit `https://yourdomain.com` - See homepage
- [ ] Visit `https://yourdomain.com/checkout` - See checkout form
- [ ] Fill guest details (Name, Email, Phone)
- [ ] Select payment method
- [ ] Click "Complete Booking"
- [ ] Should redirect to Vercel API
- [ ] Check Vercel dashboard for payment initiation
- [ ] Complete test payment
- [ ] Check Vercel payment webhook logs

---

## 🔍 Verify Files on Hostgator

**Via cPanel File Manager:**
1. cPanel → **File Manager**
2. Navigate to: `public_html`
3. Should see:
   ```
   public_html/
   ├── .next/           (directory)
   ├── .htaccess        (file)
   ├── .env.local       (optional)
   └── public/          (if uploaded)
   ```

**Via SSH:**
```bash
ssh user@yourdomain.com
ls -la public_html/
# Should show .next, .htaccess, .env.local
```

---

## 📊 Troubleshooting

### Issue: 404 Error / Page Not Found

**Cause:** .htaccess not configured correctly

**Fix:**
1. Upload `.htaccess.hostgator` from repo
2. Rename to `.htaccess` (hidden file)
3. Set permissions to `644`
4. Clear browser cache (`Ctrl+Shift+Del`)

### Issue: Blank Page / White Screen

**Cause:** .next files not uploaded completely

**Fix:**
1. Check upload completed (all files should be there)
2. SSH into server and check logs:
   ```bash
   tail -f logs/error_log
   ```
3. Restart Apache:
   ```bash
   touch .htaccess  # Force reload
   ```

### Issue: Payment Button Doesn't Work

**Cause:** API URL not set correctly

**Fix:**
1. Check Vercel API URL is correct
2. Add environment variable or .env.local:
   ```
   NEXT_PUBLIC_API_URL=https://api-burch-xxxxx.vercel.app
   ```
3. Check browser console (F12) for CORS errors
4. Verify CORS headers in .htaccess

### Issue: Styles Not Loading / Layout Broken

**Cause:** CSS/JS files not loaded

**Fix:**
1. Check `.next/static/` folder uploaded
2. Hard refresh browser (`Ctrl+Shift+R`)
3. Clear cPanel cache manager
4. Check console for 404 errors (F12)

### Issue: Can't Connect via FTP

**Cause:** Wrong credentials or port blocked

**Fix:**
1. Verify cPanel username/password
2. Try different FTP port (alternative ports: 990, 21, 2121)
3. Check Hostgator support for IP whitelist
4. Use SFTP instead (if available):
   - Port: 22
   - Protocol: SFTP (not FTP)

### Issue: Timeouts During Upload

**Cause:** Large files taking too long

**Fix:**
1. Compress files before upload:
   ```bash
   cd apps/web/.next
   tar -czf next-build.tar.gz *
   # Upload tar.gz file
   # Extract on server: tar -xzf next-build.tar.gz
   ```
2. Use lftp with resume:
   ```bash
   lftp -u user,pass ftp.host.com
   set cmd:fail-exit on
   mirror -R --parallel=5 --continue .next public_html/
   ```

---

## 🔒 Security Checklist

- [ ] SSL certificate installed (AutoSSL)
- [ ] HTTPS enforced (redirect HTTP → HTTPS in .htaccess)
- [ ] .env.local permissions set to 644
- [ ] Payment keys stored in Vercel, NOT on Hostgator
- [ ] CORS configured for allowed domains only
- [ ] Directory listing disabled (Options -Indexes in .htaccess)
- [ ] Server signature hidden (Header unset Server)
- [ ] Regular backups enabled

---

## 📝 Files to Keep Synced

After initial deployment, keep these synced between Hostgator and local:

- `.next/` - Build files (regenerate on each deploy)
- `public/` - Static assets
- `.htaccess` - Routing configuration
- `.env.local` - Environment variables

**Do NOT sync:**
- `node_modules/` - Too large
- `.git/` - Not needed
- `src/` - Source files not needed

---

## 🚀 Update Deployment

To deploy updates:

```bash
# 1. Make changes locally
# 2. Build
npm run build

# 3. Re-run deployment script
./scripts/deploy-hostgator.sh ftp.yourdomain.com user pass

# OR manually:
# 3. Delete old .next on Hostgator
# 4. Upload new .next folder
# 5. Touch .htaccess to reload
```

---

## 📊 Performance Tips

1. **Enable GZIP:** Already in .htaccess
2. **Browser Caching:** Already in .htaccess (expires headers)
3. **Minimize Requests:** Combine CSS/JS files
4. **Image Optimization:** Use Vercel Image Optimization
5. **CDN:** Use Cloudflare (free tier)

### Add Cloudflare (Free)

1. Go to: https://www.cloudflare.com
2. Sign up
3. Add domain
4. Update nameservers in Hostgator
5. Enable caching rules
6. Cache level: "Cache Everything"

---

## 📞 Hostgator Support

**Issue:** Need help with Hostgator
**Contact:**
- Phone: 1-866-96GATOR (1-866-964-2286)
- Email: support@hostgator.com
- Chat: https://www.hostgator.com/support
- Knowledge Base: https://support.hostgator.com

---

## ✅ Deployment Complete!

After following these steps:
1. ✅ Files uploaded to Hostgator
2. ✅ .htaccess configured
3. ✅ SSL enabled
4. ✅ Environment variables set
5. ✅ Ready to test payments

Your checkout is live at: **`https://yourdomain.com/checkout`**

---

**Next:** Test payment flow with sandbox credentials

See: TESTING_AND_DEPLOYMENT.md

Last Updated: August 15, 2026
