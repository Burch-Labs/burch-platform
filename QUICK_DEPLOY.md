# 🚀 Burch Platform - Quick Deployment (3 Options)

## Status
✅ **Ready to Deploy** - All payment integrations complete
- **Branch:** claude/burch-platform-q4nf5k
- **Commit:** bcf1d5d (Payment integration + deployment configs)
- **Components:** 4 (CheckoutFlow, BookingSummary, PaymentMethodCard, StripeConfirm)
- **Payment Methods:** M-Pesa, Flutterwave, Stripe
- **Features:** Guest details, payment selection, confirmation, webhooks

---

## 🔗 Deploy with One Click

### Option 1: Vercel (Recommended) ⚡
**Time: 10 min | Cost: Free tier available | Best For: Production**

👉 **DEPLOY NOW:** https://vercel.com/new/clone?repository-url=https://github.com/Burch-Labs/burch-platform&project-name=burch-platform&root-directory=apps/web

**Steps:**
1. Click link above
2. Connect GitHub account
3. Add environment variables (see below)
4. Create PostgreSQL on Supabase (free tier)
5. Click Deploy ✨
6. Your live app: `https://burch-platform-xxxxx.vercel.app/checkout`

**Environment Variables to Add:**
```
DATABASE_URL = postgresql://user:pass@host:5432/burch
NEXTAUTH_SECRET = [run: openssl rand -base64 32]
NEXTAUTH_URL = https://burch-platform-xxxxx.vercel.app
MPESA_ENV = sandbox
MPESA_CONSUMER_KEY = your_key
MPESA_CONSUMER_SECRET = your_secret
MPESA_PASSKEY = your_passkey
MPESA_SHORTCODE = 174379
FLUTTERWAVE_SECRET_KEY = your_key
FLUTTERWAVE_SECRET_HASH = your_hash
STRIPE_SECRET_KEY = sk_test_your_key
```

---

### Option 2: Railway 🚂
**Time: 15 min | Cost: $5/month | Best For: Full stack with database**

👉 **DEPLOY NOW:** https://railway.app/new

**Steps:**
1. Click link above
2. Authorize Railway GitHub
3. Select burch-platform repo
4. Set root directory: `apps/web`
5. Click "Add Service" → PostgreSQL (auto-setup)
6. Add environment variables
7. Push to main → Auto-deploys
8. Your live app: `https://burch-platform-xxxxx.up.railway.app/checkout`

**Environment Variables:**
```
NODE_ENV = production
DATABASE_URL = [auto from PostgreSQL service]
NEXTAUTH_SECRET = [run: openssl rand -base64 32]
NEXTAUTH_URL = https://burch-platform-xxxxx.up.railway.app
MPESA_ENV = sandbox
MPESA_CONSUMER_KEY = your_key
[... rest same as Vercel]
```

---

### Option 3: Hostgator 🌐
**Time: 5 min | Cost: $2.99-6.95/mo | Best For: Shared hosting**

**Steps:**
1. Buy hosting: https://www.hostgator.com/web-hosting
2. Add domain
3. cPanel → File Manager
4. Upload `apps/web/.next` to `public_html/`
5. Add `.htaccess` for routing
6. Set environment variables in cPanel
7. Your live app: `https://yourdomain.com/checkout`

**Note:** Hostgator requires Node.js support or API-only deployment

---

## 🧪 Test Your Deployment

### Test Checkout Flow
Visit: `https://your-deployed-app.com/checkout`

**Test Options:**
- Event: `https://your-app.com/checkout?type=event` (M-Pesa)
- Hotel: `https://your-app.com/checkout?type=hotel` (Flutterwave)
- Restaurant: `https://your-app.com/checkout?type=restaurant` (Stripe)

### Test Payment with Sandbox Credentials

**M-Pesa (Sandbox):**
- Phone: 0724999999
- Amount: Any 1-100,000 KES
- Shortcode: 174379

**Flutterwave (Test):**
- Card: 4239 5900 0005 9010
- Expiry: Any future date
- OTP: 123456

**Stripe (Test):**
- Card: 4242 4242 4242 4242
- Expiry: Any future date
- CVC: Any 3 digits

---

## 📝 What's Included

### Payment Integration
✅ M-Pesa STK Push (Safaricom Daraja)
✅ Flutterwave Hosted Checkout (Cards + Mobile Money)
✅ Stripe Payment Intents (International Cards)
✅ Webhook callbacks for payment confirmation
✅ Payment status verification API

### Checkout Components
✅ Multi-step form (3 steps: details → payment → confirm)
✅ Guest details collection
✅ Payment method selection
✅ Order confirmation review
✅ Orange theme (#FF8C42) throughout
✅ Trust signals (🔒 Secure, ✓ Verified, ⚡ Instant, 💯 Safe)
✅ FAQ section
✅ Mobile responsive

### Booking Types
✅ Events (Jazz Festival example)
✅ Hotels (Radisson example)
✅ Restaurants (Carnivore example)
✅ Dynamic pricing with taxes & fees

### APIs
✅ POST `/api/payments/initiate` - Create payment
✅ GET `/api/payments/verify?bookingId=xxx` - Check payment status
✅ GET `/api/payments/status/[bookingId]` - Payment details
✅ POST `/api/payments/mpesa/callback` - M-Pesa webhook
✅ GET `/api/payments/flutterwave/callback` - Flutterwave redirect
✅ GET `/api/health` - Health check

---

## 📊 Comparison Table

| Feature | Vercel | Railway | Hostgator |
|---------|--------|---------|-----------|
| Setup Time | 10 min | 15 min | 5 min |
| Cost | Free* | $5/mo | $2.99/mo |
| Database | External | Included | Not incl. |
| Auto-scaling | Yes | Yes | No |
| CI/CD | Built-in | Built-in | Manual |
| Global CDN | Yes | No | No |
| Support | Excellent | Good | Basic |
| Best For | Production | Full-stack | Shared host |

*Free tier with limits; $20/month for production

---

## 🔒 Security Checklist

Before going live:
- [ ] Change all `sk_test_*` keys to `sk_live_*` (Stripe production)
- [ ] Change `MPESA_ENV` to `production` with real credentials
- [ ] Set `NEXTAUTH_SECRET` to random 32+ char string
- [ ] Enable HTTPS on custom domain
- [ ] Set `NEXTAUTH_URL` to your real domain
- [ ] Review `.env` - no secrets in code
- [ ] Enable database backups
- [ ] Test payment webhooks
- [ ] Monitor logs for errors
- [ ] Set up error tracking (Sentry)

---

## 💡 Pro Tips

### Generate Random Secrets
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# STRIPE webhook signing secret
# Get from Stripe dashboard → Webhooks
```

### Test Payments Locally
```bash
# Before deploying, test locally:
npm run dev

# Then visit: http://localhost:5000/checkout
```

### Monitor Payments in Production
- **Stripe:** https://dashboard.stripe.com/payments
- **Flutterwave:** https://app.flutterwave.co/transactions
- **M-Pesa:** Safaricom Daraja dashboard

---

## 🆘 Troubleshooting

### "Database connection failed"
→ Verify `DATABASE_URL` matches your PostgreSQL credentials

### "Payment method not configured"
→ Check environment variables are set in deployment platform

### "Webhook not receiving"
→ Verify webhook URL in payment provider dashboard matches your domain

### "CORS error in checkout"
→ Check API routes are accessible from frontend domain

---

## 📞 Documentation Files

**In Repository:**
- `DEPLOYMENT_GUIDE.md` - Detailed deployment steps for each platform
- `TESTING_AND_DEPLOYMENT.md` - Complete testing workflow and checklist
- `.env.example` - Example environment variables

**External:**
- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Stripe Docs: https://stripe.com/docs
- Flutterwave Docs: https://developer.flutterwave.com

---

## ⏱️ Expected Timeline

| Step | Time | Platform |
|------|------|----------|
| 1. Choose platform | 2 min | - |
| 2. Set up environment | 3 min | - |
| 3. Configure payment keys | 5 min | - |
| 4. Deploy app | 10 min | All |
| 5. Run migrations | 2 min | All |
| 6. Test payments | 5 min | All |
| **Total** | **27 min** | **All Options** |

---

## 🎉 Next Steps

1. **Choose deployment platform** (Vercel recommended)
2. **Get API keys** from payment providers (M-Pesa, Flutterwave, Stripe)
3. **Click deploy link** above
4. **Add environment variables**
5. **Test payment flow** with sandbox credentials
6. **Go live** when ready!

---

## 📈 After Launch

- Set up error monitoring (Sentry, LogRocket)
- Enable payment notifications
- Monitor checkout conversion rates
- Track payment failures
- Set up automated backups
- Monitor server performance

---

**Ready? Click your platform's deploy link above! 🚀**

Questions? Check `DEPLOYMENT_GUIDE.md` or `TESTING_AND_DEPLOYMENT.md`

---

**Last Updated:** August 15, 2026
**Platform:** Burch Platform v1.0
**Branch:** claude/burch-platform-q4nf5k
