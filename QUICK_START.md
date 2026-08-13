# Quick Start: Deploy to Replit + Render

## 🚀 Replit Deployment (5 minutes)

### Step 1: Get Credentials (MUST DO)
- [ ] **Resend** (free): https://resend.com → Sign up → Get API key
- [ ] **M-Pesa Daraja** (sandbox free): https://developer.safaricom.co.ke → Create app → Get 4 credentials
- [ ] **Flutterwave** (free test mode): https://dashboard.flutterwave.com → Get Secret Key
- [ ] **Anthropic** (optional): https://console.anthropic.com → Get API key
- [ ] **Your email**: For redirecting test emails

### Step 2: Set Replit Secrets
In your Replit workspace:
1. Click **Secrets (🔒)** in left sidebar
2. Click **Create Secret** for each:

```
NEXTAUTH_SECRET=B1AXW6CUWQHVn5eGTmiA1398Dwa0ueImzuhzRR9s2tc=
NEXTAUTH_URL=https://burch-platform.replit.app
RESEND_API_KEY=<your key>
EMAIL_FROM=Burch Platform <onboarding@resend.dev>
EMAIL_OVERRIDE_TO=<your-email@gmail.com>
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=<from Daraja>
MPESA_CONSUMER_SECRET=<from Daraja>
MPESA_PASSKEY=<from Daraja>
MPESA_SHORTCODE=174379
FLUTTERWAVE_SECRET_KEY=<from Flutterwave>
FLUTTERWAVE_SECRET_HASH=<from Flutterwave webhook config>
ANTHROPIC_API_KEY=<from Anthropic>
```

### Step 3: Run Deploy
1. Click **Run** button (top right)
2. Wait for build complete (2-3 min, green checkmark)
3. Visit **https://burch-platform.replit.app** in browser
4. Verify: curl https://burch-platform.replit.app/api/health → should see `200 OK`

---

## 📋 Test Checklist
- [ ] Can sign up with email
- [ ] Can browse events/hotels/restaurants  
- [ ] Can start M-Pesa payment (use test phone: 254708374149)
- [ ] Can complete Flutterwave payment (test card: 4242 4242 4242 4242)
- [ ] Received confirmation email
- [ ] Can view digital ticket
- [ ] Can check in ticket via QR or code
- [ ] Partner can view bookings

---

## 🌍 Render + Neon Deployment (10 minutes)

### Step 1: Create Neon Database
1. Go to **neon.tech** → Sign up (free)
2. Create new project → Copy connection string
3. Save: `DATABASE_URL=postgresql://...`

### Step 2: Create Render Service
1. Go to **render.com** → Sign up
2. New → **Web Service**
3. Connect GitHub repo: `Burch-Labs/burch-platform`
4. Settings:
   - Build: `npm install && cd apps/web && npm run build`
   - Start: `cd apps/web && npm start`
   - Instance: **Free**
5. Add same **Environment Variables** from Replit above
6. Add: `DATABASE_URL=<from Neon>`
7. **Deploy**

### Step 3: Run Migration
After deploy completes, in Render Shell:
```bash
cd apps/web && npm run db:push
```

### Step 4: Test
- Visit https://burch-platform.onrender.com
- curl https://burch-platform.onrender.com/api/health

---

## ⚠️ Important Notes

- **Replit Secrets**: Case-sensitive, no spaces, exact values
- **Replit auto-deploy**: On push to `main`, autoscale builds new version
- **Render free tier**: Auto-sleeps after 15 min idle (use UptimeRobot to keep alive)
- **Database**: Replit manages it; Render uses Neon
- **Emails**: All go to `EMAIL_OVERRIDE_TO` during testing (remove when live)

---

## 🆘 Need Help?
See `DEPLOYMENT_STEPS.md` for full troubleshooting guide.
