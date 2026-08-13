# ⚡ Quick Deployment Guide (5 Steps to Launch)

## 🚀 Deploy Your App in 15 Minutes

This guide takes you from zero to production in under 15 minutes.

---

## Step 1: Get Your Credentials (2 min)

Open [RENDER_ENV_VARS.txt](RENDER_ENV_VARS.txt) in this project. You'll see a table with all the environment variables you need. These are already pre-configured:

```
DATABASE_URL → Neon database connection (already set up)
NEXTAUTH_SECRET → Session encryption (already secure)
RESEND_API_KEY → Email service (already configured)
M-Pesa Credentials → Sandbox mode (ready to test)
Flutterwave Credentials → Sandbox mode (ready to test)
... and 5 more
```

**Copy everything from that file.**

---

## Step 2: Create Render Account (2 min)

1. Go to https://render.com
2. Click **Sign up with GitHub**
3. Authorize the **Burch-Labs** organization
4. Click **New** → **Web Service**

---

## Step 3: Configure Service (5 min)

In the Render dashboard, fill in:

| Field | Value |
|-------|-------|
| **Repository** | `Burch-Labs/burch-platform` |
| **Service Name** | `burch-platform` |
| **Environment** | Node |
| **Build Command** | `npm install && cd apps/web && npm run build` |
| **Start Command** | `cd apps/web && npm start` |
| **Instance Type** | Free (0.5 CPU, 512 MB RAM) |

---

## Step 4: Add Environment Variables (3 min)

Scroll down to **Environment Variables** section.

For each line from [RENDER_ENV_VARS.txt](RENDER_ENV_VARS.txt):
- Click **Add Environment Variable**
- Paste key and value exactly
- Click **Create Web Service**

⚠️ **Important:** Copy values exactly as shown (case-sensitive, no extra spaces)

---

## Step 5: Start Database (3 min)

After deployment completes (you'll see a green checkmark):

1. Click your service name
2. Go to **Shell** tab
3. Run this command:
   ```bash
   cd apps/web && npm run db:push
   ```
4. Wait for success message

---

## ✅ You're Live!

Your app is now running at: `https://burch-platform.onrender.com`

**Quick Tests:**
```bash
# Check health
curl https://burch-platform.onrender.com/api/health

# Should show: {"status":"ok"}
```

---

## 🧪 Test the Features

Visit `https://burch-platform.onrender.com` and try:

1. **Create Account** → use any email
2. **Verify Email** → check your inbox (or `sparksnairobi@gmail.com` if EMAIL_OVERRIDE_TO is set)
3. **Browse Events** → click Events
4. **Make a Booking** → click any event
5. **Test M-Pesa Payment** → use phone: `254708374149`
6. **Test Flutterwave** → use card: `4242 4242 4242 4242`
7. **Get QR Ticket** → scan with phone
8. **Check In** → click the ticket

If all these work, you're ready to go live! 🎉

---

## 🔴 When Ready for Real Money

Before accepting real payments:

1. **Swap M-Pesa to LIVE**
   - In Render dashboard, set `MPESA_ENV=production`
   - Use your real M-Pesa Daraja credentials
   - Click **Update** and redeploy

2. **Swap Flutterwave to LIVE**
   - Replace `FLUTTERWAVE_SECRET_KEY` with live key
   - Update webhook settings in Flutterwave dashboard
   - Redeploy

3. **Secure Your Domain**
   - Purchase domain (e.g., `burch.app`)
   - Add CNAME: `burch-platform.onrender.com`
   - Update `NEXTAUTH_URL` to your domain
   - Redeploy

4. **Remove Test Configuration**
   - Delete `EMAIL_OVERRIDE_TO` (stops redirecting emails to test address)
   - Update `EMAIL_FROM` to your branded domain

---

## 🆘 Troubleshooting

### Build Failed: "RESEND_API_KEY is required"
✅ Already provided in [RENDER_ENV_VARS.txt](RENDER_ENV_VARS.txt) — verify you copied it correctly (no spaces)

### App running but features don't work
✅ Database not initialized — did you run `npm run db:push` in the Shell? (See Step 5)

### Emails not arriving
✅ Emails redirecting to `sparksnairobi@gmail.com` (test mode) — check that inbox first

### Payment buttons not working
✅ Running in sandbox mode — use test credentials from guide above

### Build taking too long (>5 min)
✅ Free Render tier is slow — this is normal. Upgrade to paid tier if speed critical.

---

## 📞 Need Help?

See full details in [LAUNCH_READINESS_REPORT.md](LAUNCH_READINESS_REPORT.md) or [DEPLOYMENT_STEPS.md](DEPLOYMENT_STEPS.md)

---

**That's it! You're deployed. Welcome to production! 🚀**
