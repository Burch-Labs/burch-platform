# Deployment Steps: Replit → Render + Neon

## Phase 1: Replit Deployment (for client testing)

### Step 1: Set Replit Secrets
In your Replit workspace, go to **Secrets (🔒)** and add these environment variables:

#### Required for any deployment:
```
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
RESEND_API_KEY=<get from https://resend.com/api-keys>
```

#### Email configuration:
```
EMAIL_FROM=Burch Platform <onboarding@resend.dev>
EMAIL_OVERRIDE_TO=<your-email@gmail.com>  # Redirect ALL emails here until ready for live
```

#### Payment gateways (sandbox for testing):
```
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=<from https://developer.safaricom.co.ke/MyApps>
MPESA_CONSUMER_SECRET=<from Daraja portal>
MPESA_PASSKEY=<from Daraja portal>
MPESA_SHORTCODE=174379  # Safaricom test shortcode

FLUTTERWAVE_SECRET_KEY=<from https://dashboard.flutterwave.com/settings/api>
FLUTTERWAVE_SECRET_HASH=<set this in Flutterwave webhook config AND here>
```

#### Optional but recommended:
```
ANTHROPIC_API_KEY=<from https://console.anthropic.com>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
```

### Step 2: Push Database Schema
In the Replit shell:
```bash
cd apps/web
npm run db:push
```

### Step 3: Deploy
Click the **Run** button in Replit (or use `npm run dev` from the shell). The autoscale deployment will build and start the app.

### Step 4: Verify Deployment
Check the deployment is healthy:
```bash
curl https://burch-platform.replit.app/api/health
```
Should return `200 OK` with no config errors.

### Step 5: Get Public URL
The production URL is: `https://burch-platform.replit.app`

Test it in your browser, create a user account, try booking an event (use M-Pesa sandbox or Flutterwave test card).

---

## Phase 2: Render + Neon Production Deployment

Once client testing is complete on Replit, move to a more reliable free platform.

### Step 1: Create Neon Database
1. Go to **neon.tech** → Sign up (free tier, 3GB storage)
2. Create a new project
3. Copy the full connection string: `postgresql://user:password@...`
4. Keep this safe — you'll need it in Render

### Step 2: Create Render Web Service
1. Go to **render.com** → Sign up (free tier)
2. New → **Web Service**
3. **Connect GitHub**: Select `burch-labs/burch-platform`
4. **Service settings**:
   - Name: `burch-platform`
   - Environment: `Node`
   - Build: `npm install && cd apps/web && npm run build`
   - Start: `cd apps/web && npm start`
   - Instance type: **Free** (0.5 CPU, 512 MB RAM)
5. **Environment variables** (add before deploying):

```env
DATABASE_URL=<paste Neon connection string>
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://burch-platform.onrender.com
RESEND_API_KEY=<from Resend>
EMAIL_FROM=Burch Platform <onboarding@resend.dev>
EMAIL_OVERRIDE_TO=<your-email>  # Still redirect for testing
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=<Daraja>
MPESA_CONSUMER_SECRET=<Daraja>
MPESA_PASSKEY=<Daraja>
MPESA_SHORTCODE=174379
FLUTTERWAVE_SECRET_KEY=<Flutterwave dashboard>
FLUTTERWAVE_SECRET_HASH=<Flutterwave webhook config>
ANTHROPIC_API_KEY=<Anthropic>
GOOGLE_CLIENT_ID=<Google Cloud>
GOOGLE_CLIENT_SECRET=<Google Cloud>
```

6. Click **Deploy** (first deploy takes 3-5 minutes)

### Step 3: Run Database Migration on Render
After deploy completes, go to Render dashboard → your service → **Shell**:
```bash
DATABASE_URL="<neon-connection-string>" npm run db:push
```

### Step 4: Verify Production Deployment
```bash
curl https://burch-platform.onrender.com/api/health
```
Should return `200 OK`.

### Step 5: Update DNS (Optional)
If you have a custom domain:
1. In Render dashboard, go to your service → **Settings** → Custom Domain
2. Point your domain's DNS to Render's CNAME
3. Update `NEXTAUTH_URL` to your custom domain

---

## Testing Checklist

- [ ] Replit deployment is live and `/api/health` returns 200
- [ ] Can sign up with email or Google
- [ ] Can browse events/hotels/restaurants
- [ ] M-Pesa sandbox payment works
- [ ] Flutterwave test card payment works
- [ ] Event ticket confirmation email received
- [ ] Hotel/restaurant enquiry creates PENDING booking
- [ ] Partner can confirm/decline booking
- [ ] Can view digital ticket (QR + code)
- [ ] Can check in ticket via QR or code entry
- [ ] Render deployment is live and healthy
- [ ] All integrations work on Render (databases, emails, payments)

---

## Troubleshooting

**Replit deployment won't start?**
- Check `/api/health` for config errors in the logs
- All required environment variables must be set in Secrets
- Common issues: missing `NEXTAUTH_SECRET`, `RESEND_API_KEY`, or payment keys

**Emails not sending?**
- Verify `RESEND_API_KEY` is set in Secrets
- Check Resend dashboard — sending domain may need verification
- If using `EMAIL_OVERRIDE_TO`, all emails go to that address (useful for testing)

**M-Pesa payment fails?**
- Ensure `MPESA_ENV=sandbox`
- Use test phone: `254708374149`
- Check Daraja portal for shortcode/credentials
- All four MPESA_* variables must be set

**Flutterwave payment fails?**
- Verify webhook URL is configured in Flutterwave dashboard: `https://your-url/api/payments/flutterwave/webhook`
- `FLUTTERWAVE_SECRET_HASH` must match the value set in webhook config
- Use Flutterwave test card: `4242 4242 4242 4242`

**Render keeps sleeping (free tier)?**
- Free tier services auto-sleep after 15 min of inactivity
- To keep it running, either upgrade to Paid ($7/mo) or use an uptime monitor
- UptimeRobot (free tier) can ping `/api/health` every 5 minutes to keep it warm
