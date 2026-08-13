# 🎯 Your Personal Deployment Guide

**Email for testing**: sparksnairobi@gmail.com

---

## Step 1: Create Neon Database ⏱️ 5 min

### 1.1 Sign Up
1. Go to **https://neon.tech**
2. Click **Sign up** → **Continue with GitHub**
3. Authorize with your GitHub account
4. Confirm email

### 1.2 Create Project
1. Click **Create a new project**
2. Give it a name: `burch-platform`
3. Click **Create project**

### 1.3 Get Connection String
1. You'll see a connection string screen
2. Look for a string like:
   ```
   postgresql://user:password@ep-xxx.us-east-1.neon.tech/dbname?sslmode=require
   ```
3. **COPY THIS ENTIRE STRING** → This is your `DATABASE_URL`
4. Save it in a safe place (you'll need it for Render)

✅ **Done with Neon!** Move to Step 2.

---

## Step 2: Gather Credentials

### 2.1 Resend API Key
**You said you have this already.**

1. Go to **https://resend.com/api-keys**
2. Copy your API key
3. Note: It starts with `re_`

**SAVE THIS**: `RESEND_API_KEY = re_...`

### 2.2 M-Pesa Credentials (From Daraja)
**You said you have these already.**

You should have from https://developer.safaricom.co.ke:
- `MPESA_CONSUMER_KEY` (looks like `abc123...`)
- `MPESA_CONSUMER_SECRET` (looks like `xyz789...`)
- `MPESA_PASSKEY` (given in portal)
- `MPESA_SHORTCODE` (usually `174379` for sandbox)

**SAVE THESE**:
```
MPESA_CONSUMER_KEY = 
MPESA_CONSUMER_SECRET = 
MPESA_PASSKEY = 
MPESA_SHORTCODE = 174379
```

### 2.3 Flutterwave Credentials
**You said you have these already.**

1. Go to **https://dashboard.flutterwave.com**
2. Go to **Settings** → **API**
3. Copy `Secret Key` (starts with `FLWSECK_...`)

**SAVE THIS**: `FLUTTERWAVE_SECRET_KEY = FLWSECK_...`

#### For FLUTTERWAVE_SECRET_HASH:
1. In Flutterwave dashboard, go to **Settings** → **Webhooks**
2. Set webhook URL to: `https://burch-platform.onrender.com/api/payments/flutterwave/webhook`
3. Copy the **Secret Hash** (shown when you set the webhook)

**SAVE THIS**: `FLUTTERWAVE_SECRET_HASH = ...`

---

## Step 3: Generate NEXTAUTH_SECRET

Use this value:
```
B1AXW6CUWQHVn5eGTmiA1398Dwa0ueImzuhzRR9s2tc=
```

Or generate a new one by running:
```bash
openssl rand -base64 32
```

**SAVE THIS**: `NEXTAUTH_SECRET = ...`

---

## Step 4: Create Render Web Service ⏱️ 10 min

### 4.1 Sign Up
1. Go to **https://render.com**
2. Click **Sign up** → **GitHub**
3. Authorize with GitHub

### 4.2 Create Web Service
1. Click **New** → **Web Service**
2. Click **Deploy from a Git repository**
3. Click **Connect account** (if needed)
4. Select `Burch-Labs/burch-platform`
5. Click **Connect**

### 4.3 Configure Service
Fill in these fields:

| Field | Value |
|-------|-------|
| **Name** | `burch-platform` |
| **Environment** | `Node` |
| **Build Command** | `npm install && cd apps/web && npm run build` |
| **Start Command** | `cd apps/web && npm start` |
| **Instance Type** | **Free** |

### 4.4 Add Environment Variables

**⚠️ IMPORTANT**: Before clicking Deploy, add ALL these variables:

#### Copy-paste these EXACTLY:

```env
DATABASE_URL=<YOUR NEON CONNECTION STRING>
NEXTAUTH_SECRET=B1AXW6CUWQHVn5eGTmiA1398Dwa0ueImzuhzRR9s2tc=
NEXTAUTH_URL=https://burch-platform.onrender.com
RESEND_API_KEY=<YOUR RESEND KEY>
EMAIL_FROM=Burch Platform <onboarding@resend.dev>
EMAIL_OVERRIDE_TO=sparksnairobi@gmail.com
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=<FROM DARAJA>
MPESA_CONSUMER_SECRET=<FROM DARAJA>
MPESA_PASSKEY=<FROM DARAJA>
MPESA_SHORTCODE=174379
FLUTTERWAVE_SECRET_KEY=<FROM FLUTTERWAVE>
FLUTTERWAVE_SECRET_HASH=<FROM FLUTTERWAVE>
```

**Click "Add Environment Variable" for EACH line.**

### 4.5 Deploy
1. Click **Create Web Service**
2. Watch the build logs (should take 3-5 min)
3. Wait for green checkmark ✅
4. Note your URL: `https://burch-platform.onrender.com`

---

## Step 5: Initialize Database ⏱️ 2 min

Once deployment is green:

1. In Render dashboard, click your service
2. Go to **Shell** tab
3. Run this command:
   ```bash
   cd apps/web && npm run db:push
   ```
4. Wait for success message

---

## Step 6: Test Everything ⏱️ 10 min

### 6.1 Check Health
```bash
curl https://burch-platform.onrender.com/api/health
```
Should return `200 OK`

### 6.2 Visit App
Open: https://burch-platform.onrender.com

### 6.3 Quick Test
- [ ] Create account (use sparksnairobi@gmail.com)
- [ ] Browse events
- [ ] Try M-Pesa payment (test phone: 254708374149)
- [ ] Try Flutterwave (test card: 4242 4242 4242 4242)
- [ ] Check email for confirmations
- [ ] View digital ticket
- [ ] Try check-in with QR code

---

## 📋 Summary

| Step | Time | Action |
|------|------|--------|
| 1 | 5 min | Create Neon account + database |
| 2 | 5 min | Gather credentials from your sources |
| 3 | 1 min | Use NEXTAUTH_SECRET provided |
| 4 | 10 min | Create Render service + add variables |
| 5 | 2 min | Run db:push in Render Shell |
| 6 | 10 min | Test everything |
| **TOTAL** | **~30 min** | **Live deployment ready!** |

---

## ❓ Need Help?

1. **Stuck on Neon?** → Ask, I'll help create account
2. **Can't find credentials?** → Tell me which ones, I'll guide
3. **Render deployment fails?** → Share error logs, I'll debug
4. **App won't start?** → Check `/api/health` logs, I'll help

**Ready to start? Begin with Step 1!**

Once you complete each step, let me know:
- ✅ Neon connection string
- ✅ Credentials gathered
- ✅ Render service created
- ✅ Deployment live URL
- ✅ Tests passing

I'll be here to help with each one! 🚀
