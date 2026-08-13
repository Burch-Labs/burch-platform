# Production Deployment: Render + Neon

## 📋 Credentials Checklist

Before starting, gather these from your sources:

**Required:**
- [ ] Resend API Key (from your earlier GitHub/project)
- [ ] M-Pesa credentials from Daraja:
  - [ ] MPESA_CONSUMER_KEY
  - [ ] MPESA_CONSUMER_SECRET
  - [ ] MPESA_PASSKEY
  - [ ] MPESA_SHORTCODE (use 174379 for sandbox testing, or your production one)
- [ ] Flutterwave Secret Key (from dashboard.flutterwave.com)
- [ ] Flutterwave Secret Hash (from Flutterwave webhook config)

**Optional:**
- [ ] Anthropic API Key (from console.anthropic.com)
- [ ] Google OAuth credentials (from Google Cloud Console)

**System:**
- [ ] Your email address (for testing email redirects)

---

## 🗄️ Step 1: Create Neon Database (5 minutes)

1. Go to **https://neon.tech**
2. Sign up (free account)
3. Create new project
4. Copy the full connection string:
   ```
   postgresql://user:password@ep-xxx.us-east-1.neon.tech/dbname?sslmode=require
   ```
5. Save this as `DATABASE_URL` (you'll need it for Render)

---

## 🚀 Step 2: Deploy to Render (10 minutes)

### 2a. Create Web Service
1. Go to **https://render.com**
2. Sign up (free account)
3. Click **New** → **Web Service**
4. Select **Deploy from a Git repository**
5. Click **Connect account** → Select `Burch-Labs/burch-platform`

### 2b. Configure Service
1. **Name**: `burch-platform`
2. **Environment**: `Node`
3. **Build Command**: 
   ```
   npm install && cd apps/web && npm run build
   ```
4. **Start Command**: 
   ```
   cd apps/web && npm start
   ```
5. **Instance Type**: **Free** (0.5 CPU, 512 MB RAM)
6. **Auto-deploy**: Enable (deploys on every push to `main`)

### 2c: Add Environment Variables
Before clicking Deploy, add ALL of these. Click **Add Environment Variable** for each:

```
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.neon.tech/dbname?sslmode=require

NEXTAUTH_SECRET=<generate: openssl rand -base64 32>
NEXTAUTH_URL=https://burch-platform.onrender.com

RESEND_API_KEY=<your Resend key>
EMAIL_FROM=Burch Platform <onboarding@resend.dev>
EMAIL_OVERRIDE_TO=<your-email@gmail.com>

MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=<from Daraja>
MPESA_CONSUMER_SECRET=<from Daraja>
MPESA_PASSKEY=<from Daraja>
MPESA_SHORTCODE=174379

FLUTTERWAVE_SECRET_KEY=<from Flutterwave>
FLUTTERWAVE_SECRET_HASH=<from Flutterwave>

ANTHROPIC_API_KEY=<from Anthropic (optional)>
GOOGLE_CLIENT_ID=<from Google Cloud (optional)>
GOOGLE_CLIENT_SECRET=<from Google Cloud (optional)>
```

**⚠️ IMPORTANT**: Copy-paste exactly (no extra spaces, case-sensitive)

### 2d: Deploy
1. Click **Create Web Service**
2. Wait for build (3-5 minutes) — watch the logs
3. Once green checkmark appears, your URL is live

---

## ✅ Step 3: Initialize Database (2 minutes)

1. In Render dashboard, open your service
2. Go to **Shell** tab
3. Run database migration:
   ```bash
   cd apps/web && npm run db:push
   ```
4. Wait for "Database migrations applied" message

---

## 🔍 Step 4: Verify Deployment

### Check Health
```bash
curl https://burch-platform.onrender.com/api/health
```
Should return: `{"status":"ok"}` with HTTP 200

### Visit the app
https://burch-platform.onrender.com

### Test checklist
- [ ] Can sign up with email (check your inbox)
- [ ] Can view events/hotels/restaurants
- [ ] Can start M-Pesa payment
- [ ] Can complete Flutterwave test payment
- [ ] Received confirmation email
- [ ] Can view digital ticket with QR code
- [ ] Can check in ticket

---

## ⚙️ Troubleshooting

### Deployment won't build
- Check **Build Logs** in Render dashboard
- Common: Missing environment variables (see console errors)
- Solution: Check each variable is set exactly right

### "Config error" on /api/health
- Missing or wrong environment variable
- Check Render logs: look for `⚙️ BURCH — CONFIG CHECK` block
- Verify all M-Pesa variables are set if `MPESA_ENV=sandbox`

### Database connection fails
- Verify `DATABASE_URL` is correct from Neon
- Make sure Neon IP whitelist includes Render (usually automatic)
- Try re-running `db:push` from Render Shell

### Emails not sending
- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard — sending domain verified?
- If `EMAIL_OVERRIDE_TO` set, all emails go there (for testing)

### Render free tier sleeping
- Free tier auto-sleeps after 15 min inactivity
- To keep alive: Set up UptimeRobot (free) to ping every 5 min
- Or upgrade to Paid ($7/mo) for always-on

---

## 🎯 Next Steps After Verification

1. **Send link to clients**: https://burch-platform.onrender.com
2. **Redirect emails**: Once real partners sign up, remove `EMAIL_OVERRIDE_TO`
3. **Enable real M-Pesa**: When ready, change `MPESA_ENV=production` + production shortcode (requires Safaricom approval)
4. **Custom domain** (optional): Update DNS, change `NEXTAUTH_URL` to custom domain
5. **Monitoring**: Set up UptimeRobot + Sentry for production monitoring

---

## 💾 Important: Backup Database

Before any schema changes in production:
```bash
PGPASSWORD="password" pg_dump -U username -h host dbname > backup.sql
```

Neon has built-in backups (Premium+), but manual backups are cheap insurance.
