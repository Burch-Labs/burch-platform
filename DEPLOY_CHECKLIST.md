# 🚀 Render + Neon Deployment Checklist

## Phase 1: Prepare Credentials (You do this)

### [ ] Step 1: Neon Database
- [ ] Go to https://neon.tech
- [ ] Sign up with GitHub (1 min)
- [ ] Create new project
- [ ] Copy full `DATABASE_URL` connection string
- [ ] Save to CREDENTIALS_TEMPLATE.txt

### [ ] Step 2: Gather Payment Credentials
- [ ] M-Pesa Daraja: Get MPESA_CONSUMER_KEY, SECRET, PASSKEY, SHORTCODE
- [ ] Flutterwave: Get FLUTTERWAVE_SECRET_KEY
- [ ] Flutterwave: Set webhook URL + get FLUTTERWAVE_SECRET_HASH
- [ ] Save to CREDENTIALS_TEMPLATE.txt

### [ ] Step 3: Get Email Service
- [ ] Resend: Go to https://resend.com
- [ ] Sign up with GitHub
- [ ] Create API key
- [ ] Verify sending domain
- [ ] Save to CREDENTIALS_TEMPLATE.txt

### [ ] Step 4: Generate NEXTAUTH_SECRET (use this)
```
NEXTAUTH_SECRET = B1AXW6CUWQHVn5eGTmiA1398Dwa0ueImzuhzRR9s2tc=
```

---

## Phase 2: Deploy to Render (You do this)

### [ ] Step 1: Create Render Account
- [ ] Go to https://render.com
- [ ] Sign up with GitHub
- [ ] Authorize Burch-Labs org

### [ ] Step 2: Create Web Service
- [ ] New → Web Service
- [ ] Connect to `Burch-Labs/burch-platform`
- [ ] Name: `burch-platform`
- [ ] Environment: `Node`
- [ ] Build: `npm install && cd apps/web && npm run build`
- [ ] Start: `cd apps/web && npm start`
- [ ] Instance: **Free**

### [ ] Step 3: Add Environment Variables
In Render dashboard, before clicking Deploy:
- [ ] Add ALL variables from CREDENTIALS_TEMPLATE.txt
- [ ] **Double-check**: Each value copied exactly (no spaces, case-sensitive)
- [ ] Verify `MPESA_SHORTCODE` is set to `174379` for sandbox

### [ ] Step 4: Deploy
- [ ] Click **Create Web Service**
- [ ] Wait 3-5 minutes
- [ ] Check for green checkmark
- [ ] Note your URL: `https://burch-platform.onrender.com`

---

## Phase 3: Initialize Database (You do this)

### [ ] Step 1: Run Migration
In Render dashboard:
1. Open your service
2. Go to **Shell** tab
3. Run:
   ```bash
   cd apps/web && npm run db:push
   ```
4. Wait for success message

---

## Phase 4: Verify & Test (You do this)

### [ ] Step 1: Check Health
```bash
curl https://burch-platform.onrender.com/api/health
```
Should show: `{"status":"ok"}` with 200

### [ ] Step 2: Visit App
https://burch-platform.onrender.com

### [ ] Step 3: Test Features
- [ ] Create account with email
- [ ] Browse events/hotels/restaurants
- [ ] Start M-Pesa payment (test phone: 254708374149)
- [ ] Complete Flutterwave payment (test card: 4242 4242 4242 4242)
- [ ] Receive confirmation email
- [ ] View digital ticket with QR code
- [ ] Check in ticket (scan or manual code)
- [ ] View booking history

---

## 📊 What I Can Help With After Deployment

Once your Render app is live, I can:
- ✅ Review logs if something breaks
- ✅ Debug config errors
- ✅ Test payment integrations
- ✅ Verify database migrations
- ✅ Help with Sentry monitoring setup
- ✅ Optimize for production

---

## ⏱️ Timeline

- Neon setup: **5 min**
- Render setup: **10 min**
- First deploy: **3-5 min**
- Database migration: **2 min**
- Testing: **10 min**

**Total: ~30-40 minutes**

---

## 🆘 If Something Goes Wrong

Check these in order:
1. **Build failed?** → Check Render Build Logs
2. **Config error?** → Review env vars in CREDENTIALS_TEMPLATE.txt
3. **Database won't connect?** → Verify DATABASE_URL from Neon
4. **Emails not sending?** → Check RESEND_API_KEY + domain verified in Resend
5. **Payments failing?** → Verify all MPESA_* and FLUTTERWAVE_* vars set

See `RENDER_DEPLOYMENT.md` for detailed troubleshooting.

---

## ✅ Ready to Start?

1. Open CREDENTIALS_TEMPLATE.txt
2. Gather all values
3. Follow Phase 1-4 above
4. Send me the URL when live
5. I'll help verify everything works!
