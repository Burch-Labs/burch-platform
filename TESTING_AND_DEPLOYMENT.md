# Burch Platform - Complete Testing & Deployment Guide

## 🎯 Quick Start - Test Everything Locally

### 1. Install & Run Dev Server
```bash
cd /home/user/burch-platform
npm install --legacy-peer-deps
npm run dev
```

Open: http://localhost:5000

### 2. Test Checkout Pages

#### Event Booking (M-Pesa)
- URL: http://localhost:5000/checkout?type=event
- Test with: M-Pesa (STK Push)
- Amount: KES 5,900 (2 × 2,500 + 400 tax)

#### Hotel Booking (Flutterwave)
- URL: http://localhost:5000/checkout?type=hotel
- Test with: Flutterwave (Card or Mobile Money)
- Amount: KES 10,275 (1 × 8,500 + 1,275 tax + 500 fee)

#### Restaurant Booking (Stripe)
- URL: http://localhost:5000/checkout?type=restaurant
- Test with: Stripe (International Cards)
- Amount: KES 9,000 (2 × 4,000 + 600 tax + 200 fee)

---

## 💳 Payment Provider Test Credentials

### M-Pesa Sandbox
**Environment:** `MPESA_ENV=sandbox`
**Test Shortcode:** 174379
**Test Phone:** 0724999999
**Test Amount:** 1-100,000 KES
**Expected:** STK prompt on phone within 30 seconds

**Setup in .env:**
```
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your_sandbox_key
MPESA_CONSUMER_SECRET=your_sandbox_secret
MPESA_PASSKEY=your_sandbox_passkey
MPESA_SHORTCODE=174379
```

### Flutterwave Sandbox
**Test Card:** 4239 5900 0005 9010
**Expiry:** Any future date (e.g., 09/25)
**CVV:** 123
**OTP:** 123456 (when prompted)
**Amount:** Any amount supported by KES

**Setup in .env:**
```
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_your_test_key
FLUTTERWAVE_SECRET_HASH=your_webhook_hash
```

### Stripe Sandbox
**Test Card (Visa):** 4242 4242 4242 4242
**Test Card (Mastercard):** 5555 5555 5555 4444
**Test Card (Amex):** 3782 822463 10005
**Expiry:** Any future date (e.g., 12/25)
**CVC:** Any 3 digits
**Amount:** Any amount in smallest currency unit

**Setup in .env:**
```
STRIPE_SECRET_KEY=sk_test_your_test_key_from_stripe_dashboard
```

---

## 📋 Complete Testing Workflow

### Step 1: Test Guest Details Form
1. Navigate to http://localhost:5000/checkout
2. Click "Continue" without filling form
   - ✅ Should show error: "Please fill in all guest details"
3. Fill in all fields:
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - Phone: +254724999999
4. Click "Continue"
   - ✅ Should progress to payment step with progress bar at 66%

### Step 2: Test Payment Method Selection
1. Three payment methods should be visible:
   - 📱 M-Pesa (< 30 seconds)
   - 💳 Flutterwave (1-2 minutes)
   - 💰 Stripe (Instant)
2. Select M-Pesa (default)
   - ✅ Should highlight in orange with border
3. Click each to verify selection works
   - ✅ Radio button should update
4. Click "Continue" with M-Pesa selected
   - ✅ Should progress to confirmation step

### Step 3: Test Confirmation Review
1. Should display:
   - Guest Name: John Doe
   - Email: john@example.com
   - Phone: +254724999999
   - Payment Method: M-Pesa
2. Green success indicator should show
3. Button should say "✓ Complete Booking"

### Step 4: Process Actual Payment

#### M-Pesa Test (Sandbox)
1. Click "Complete Booking" with M-Pesa selected
2. You should see: "STK prompt sent to customer's phone"
3. Redirect to: `/checkout/complete?result=pending`
4. Simulate payment:
   ```bash
   curl -X POST http://localhost:5000/api/payments/mpesa/callback \
     -H "Content-Type: application/json" \
     -d '{
       "Body": {
         "stkCallback": {
           "CheckoutRequestID": "your-request-id",
           "ResultCode": 0,
           "CallbackMetadata": {
             "Item": [
               {"Name": "MpesaReceiptNumber", "Value": "TEST123456"}
             ]
           }
         }
       }
     }'
   ```

#### Flutterwave Test
1. Click "Complete Booking" with Flutterwave selected
2. Redirects to Flutterwave hosted checkout
3. Enter test card: 4239 5900 0005 9010
4. Enter test OTP: 123456
5. Should redirect back to: `/checkout/complete?result=success`

#### Stripe Test
1. Click "Complete Booking" with Stripe selected
2. Redirects to `/checkout/stripe-confirm?paymentIntentId=...`
3. Fills demo form with test card 4242 4242 4242 4242
4. Click "Pay Now"
5. Should redirect to: `/checkout/complete?result=success`

### Step 5: Verify Payment Records
```bash
# Connect to database
npm run db:client

# Check payments
SELECT * FROM "Payment" WHERE "bookingId" = 'your-booking-id';

# Check bookings
SELECT * FROM "Booking" WHERE "id" = 'your-booking-id';

# Verify totals
SELECT COUNT(*) as total_payments, SUM(amount) as total_amount FROM "Payment";
```

---

## 🚀 One-Click Deployment Links

### ▶️ Deploy to Vercel (10 minutes)
https://vercel.com/new/clone?repository-url=https://github.com/Burch-Labs/burch-platform&project-name=burch-platform&root-directory=apps/web

**After clicking:**
1. Connect GitHub account
2. Add environment variables (see DEPLOYMENT_GUIDE.md)
3. Create PostgreSQL database on Supabase/Railway
4. Click Deploy
5. Your app: `https://burch-platform-xxxxx.vercel.app`

### ▶️ Deploy to Railway (15 minutes)
1. Go to: https://railway.app/new
2. Click "GitHub Repo" → Select burch-platform
3. Add PostgreSQL service
4. Set environment variables
5. Railway auto-deploys
6. Your app: `https://burch-platform-xxxxx.up.railway.app`

### ▶️ Deploy to Hostgator (5 minutes)
1. Go to: https://www.hostgator.com/web-hosting
2. Select hosting plan
3. Add domain
4. Use cPanel to upload files via FTP
5. Configure .htaccess for Next.js routing
6. Your app: `https://yourdomain.com`

---

## ✅ Post-Deployment Testing

### 1. Health Check API
```bash
curl https://your-deployed-app.com/api/health
# Should return: { "status": "ok" }
```

### 2. Test Events API
```bash
curl https://your-deployed-app.com/api/events
# Should return array of events with IDs, titles, prices
```

### 3. Test Checkout Flow
Visit: `https://your-deployed-app.com/checkout?type=event`

### 4. Test Payment Status
```bash
curl "https://your-deployed-app.com/api/payments/verify?bookingId=your-booking-id"
# Should return payment status and details
```

### 5. Monitor Real Payments
- **M-Pesa:** Check Safaricom Daraja dashboard for transaction history
- **Flutterwave:** Check Flutterwave dashboard → Transactions
- **Stripe:** Check Stripe dashboard → Payments

---

## 📊 Component Testing Checklist

### CheckoutFlow Component
- [ ] Form validation works (fields required)
- [ ] Step navigation works (Next/Back buttons)
- [ ] Progress bar updates correctly
- [ ] Payment methods display with descriptions
- [ ] Selected payment method highlights in orange
- [ ] Error messages display when validation fails
- [ ] Loading state shows "Processing..." during payment
- [ ] Redirect works after successful payment

### PaymentMethodCard Component
- [ ] Icon displays correctly
- [ ] Provider name and description show
- [ ] Processing time visible
- [ ] Fee information displays
- [ ] Selection state toggles radio button
- [ ] Orange highlight on selection
- [ ] Hover effects work on desktop

### BookingSummary Component
- [ ] Product image displays correctly
- [ ] Type label shows (🎫 Event, 🏨 Hotel, 🍽️ Restaurant)
- [ ] Price calculation correct (qty × unit + tax + fee)
- [ ] Currency formatting shows (KES)
- [ ] Trust signals display (🔒 Secure, ✓ Verified)
- [ ] Responsive on mobile (single column)

### Checkout Page
- [ ] NavBar displays at top
- [ ] Orange gradient background renders
- [ ] FAQ section expandable/collapsible
- [ ] Trust signals footer visible
- [ ] Responsive grid layout works
- [ ] All three booking types load correctly

---

## 🔍 API Endpoint Testing

### Create Payment
```bash
curl -X POST http://localhost:5000/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking-12345",
    "amount": 5000,
    "currency": "KES",
    "paymentMethod": "mpesa",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+254724999999",
    "title": "Event Ticket",
    "description": "Nairobi Jazz Festival 2026"
  }'
```

**Expected Response:**
```json
{
  "status": "initiated",
  "method": "mpesa",
  "message": "STK prompt sent to customer's phone",
  "paymentId": "pay-xxxxxxxx"
}
```

### Verify Payment Status
```bash
curl "http://localhost:5000/api/payments/verify?bookingId=booking-12345"
```

**Expected Response:**
```json
{
  "bookingId": "booking-12345",
  "status": "PENDING|SUCCESS|FAILED",
  "amount": "5000",
  "currency": "KES",
  "provider": "MPESA",
  "createdAt": "2026-08-15T10:30:00.000Z",
  "updatedAt": "2026-08-15T10:35:00.000Z"
}
```

---

## 🐛 Troubleshooting

### "Payment method is not configured"
**Cause:** Environment variable not set
**Fix:**
```bash
# Add to .env file:
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_PASSKEY=your_passkey
MPESA_SHORTCODE=174379

# Restart dev server
npm run dev
```

### Payment webhook not triggering
**Cause:** Callback URL not reachable
**Fix:**
- For local testing: Use ngrok to expose localhost
  ```bash
  npx ngrok http 5000
  # Use ngrok URL in payment provider dashboard
  ```
- For deployed: Use your actual domain in webhooks

### Database not syncing payments
**Cause:** Prisma migrations not run
**Fix:**
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### Payment form not submitting
**Cause:** JavaScript error or missing API route
**Fix:**
1. Check browser console for errors (F12)
2. Verify `/api/payments/initiate` exists
3. Check network tab for failed requests

### Deployment fails on Railway
**Cause:** PostgreSQL connection error
**Fix:**
1. Verify DATABASE_URL matches Railway PostgreSQL
2. Run migrations in Railway terminal:
   ```bash
   npm run db:migrate
   ```
3. Check Railway dashboard logs

---

## 📈 Performance Testing

### Checkout Page Load Time
```bash
# Should load in < 2 seconds
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/checkout
```

### Payment API Response Time
```bash
# Should respond in < 500ms
curl -w "Time: %{time_total}s\n" -o /dev/null -s \
  -X POST http://localhost:5000/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"test","amount":100,"currency":"KES","paymentMethod":"mpesa"}'
```

### Database Query Performance
```bash
# Check slow queries
SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;
```

---

## 📚 Documentation Links

- **Next.js:** https://nextjs.org/docs
- **React:** https://react.dev
- **Prisma:** https://www.prisma.io/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **M-Pesa Daraja:** https://developer.safaricom.co.ke
- **Flutterwave:** https://developer.flutterwave.com/docs
- **Stripe:** https://stripe.com/docs/payments

---

## ✨ Next Steps After Testing

1. **Set up monitoring** - Add Sentry or LogRocket
2. **Enable analytics** - Track checkout conversion
3. **Add CI/CD** - Set up GitHub Actions
4. **Configure emails** - Send booking confirmations
5. **Set up backups** - Database automatic backups
6. **Monitor payments** - Set up alerts for failed payments
7. **Scale up** - Enable auto-scaling on Vercel/Railway

---

**Last Updated:** August 15, 2026
**Branch:** claude/burch-platform-q4nf5k
**Commit:** bcf1d5d
