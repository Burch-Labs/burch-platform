# Burch Platform - Deployment Guide

## 🚀 Three Deployment Options

### Option 1: Vercel (Recommended for Next.js) ⚡
**Deployment Time:** ~10 minutes | **Cost:** Free tier available | **Best For:** Production with optimal Next.js performance

#### Setup Steps:

1. **Connect Repository**
   - Go to https://vercel.com/new
   - Connect your GitHub account
   - Select `burch-labs/burch-platform` repository
   - Import from `apps/web` directory

2. **Configure Environment Variables**
   In Vercel dashboard, add these variables:
   ```
   DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/burch
   NEXTAUTH_SECRET=[generate-random-32-char-string]
   NEXTAUTH_URL=https://your-app.vercel.app
   MPESA_ENV=production
   MPESA_CONSUMER_KEY=[your-key]
   MPESA_CONSUMER_SECRET=[your-secret]
   MPESA_PASSKEY=[your-passkey]
   MPESA_SHORTCODE=[your-shortcode]
   FLUTTERWAVE_SECRET_KEY=[your-key]
   FLUTTERWAVE_SECRET_HASH=[your-hash]
   STRIPE_SECRET_KEY=[your-key]
   ```

3. **Database Setup**
   - Create PostgreSQL on Railway.app, Supabase, or AWS RDS
   - Update `DATABASE_URL` with connection string
   - Run migrations after first deployment

4. **Deploy**
   - Click "Deploy" → Vercel automatically builds and deploys
   - Your app is live at `https://[project-name].vercel.app`

5. **Post-Deployment**
   ```bash
   # Run database migrations
   npm run db:migrate
   npm run db:seed
   ```

#### Vercel Dashboard: https://vercel.com/dashboard

---

### Option 2: Railway (Full Stack) 🚂
**Deployment Time:** ~15 minutes | **Cost:** $5/month minimum | **Best For:** Complete application with database

#### Setup Steps:

1. **Connect Repository**
   - Go to https://railway.app/new
   - Click "GitHub Repo" and authorize Railway
   - Select `burch-labs/burch-platform` repository

2. **Configure Build**
   - Framework: Next.js
   - Root Directory: `apps/web`
   - Build Command: `npm run build`
   - Start Command: `npm run start`

3. **Add PostgreSQL Database**
   - Click "Add Service" → PostgreSQL
   - Railway auto-generates `DATABASE_URL`
   - No manual configuration needed

4. **Set Environment Variables**
   In Railway project settings:
   ```
   NODE_ENV=production
   NEXTAUTH_SECRET=[generate-random-32-char-string]
   NEXTAUTH_URL=https://[railway-app-url]
   MPESA_ENV=production
   MPESA_CONSUMER_KEY=[your-key]
   MPESA_CONSUMER_SECRET=[your-secret]
   MPESA_PASSKEY=[your-passkey]
   MPESA_SHORTCODE=[your-shortcode]
   FLUTTERWAVE_SECRET_KEY=[your-key]
   FLUTTERWAVE_SECRET_HASH=[your-hash]
   STRIPE_SECRET_KEY=[your-key]
   ```

5. **Deploy**
   - Push to main branch
   - Railway auto-deploys
   - Access at generated Railway URL

6. **Post-Deployment**
   ```bash
   # Connect to Railway PostgreSQL and run migrations
   npm run db:migrate
   npm run db:seed
   ```

#### Railway Dashboard: https://railway.app/dashboard

---

### Option 3: Hostgator (Traditional Hosting) 🌐
**Deployment Time:** ~5 minutes | **Cost:** $2.99-6.95/month | **Best For:** Shared hosting environments

#### Setup Steps:

1. **Build Application**
   ```bash
   npm run build
   npm run db:migrate
   npm run db:seed
   ```

2. **Export Static Files** (if using static export)
   ```bash
   next export
   ```
   Files go to `out/` directory

3. **Connect via FTP**
   - Use FTP client (FileZilla, WinSCP)
   - Host: ftp.yourdomain.com
   - Username: Your cPanel username
   - Password: Your cPanel password
   - Port: 21

4. **Upload Files**
   - Upload `out/` directory contents to `public_html/`
   - Or use Git deployment if Hostgator supports it

5. **Configure .htaccess**
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

6. **Environment Variables**
   - Set in cPanel → Environment Variables
   - Or in application configuration file

#### Note:
For dynamic SSR features (authentication, payments), Hostgator requires:
- Node.js support (check with hosting provider)
- Or use a separate API service

---

## 📋 Environment Variables Checklist

**Required for All Deployments:**
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXTAUTH_SECRET` - Random 32+ character string
- [ ] `NEXTAUTH_URL` - Your application URL

**Payment Providers (Optional):**
- [ ] `MPESA_ENV` - Set to "production"
- [ ] `MPESA_CONSUMER_KEY` - From Safaricom Daraja
- [ ] `MPESA_CONSUMER_SECRET` - From Safaricom Daraja
- [ ] `MPESA_PASSKEY` - M-Pesa configuration
- [ ] `MPESA_SHORTCODE` - M-Pesa business shortcode
- [ ] `FLUTTERWAVE_SECRET_KEY` - From Flutterwave dashboard
- [ ] `FLUTTERWAVE_SECRET_HASH` - Webhook verification
- [ ] `STRIPE_SECRET_KEY` - From Stripe dashboard

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## 🧪 Testing After Deployment

### 1. Health Check
```bash
curl https://your-deployed-app.com/api/health
```
Should return: `{ "status": "ok" }`

### 2. Test Checkout Page
- Navigate to `/checkout`
- All three payment methods should be visible
- Form validation should work

### 3. Test Payments (Sandbox)

**M-Pesa Test:**
- Set `MPESA_ENV=sandbox`
- Use test shortcode: 174379
- Phone: 0724999999
- Amount: Any amount in KES

**Flutterwave Test:**
- Use test card: 4239 5900 0005 9010
- Expiry: Any future date
- OTP: 123456 (when prompted)

**Stripe Test:**
- Use card: 4242 4242 4242 4242
- Expiry: Any future date
- CVC: Any 3 digits

### 4. Verify Database
```bash
# Connect to PostgreSQL
psql [DATABASE_URL]

# Check tables
\dt

# Verify seed data
SELECT COUNT(*) FROM "Event";
SELECT COUNT(*) FROM "Hotel";
SELECT COUNT(*) FROM "Restaurant";
```

---

## 🔒 Security Checklist

- [ ] All API keys set as environment variables (not in code)
- [ ] `NEXTAUTH_SECRET` is unique and random
- [ ] HTTPS enforced on custom domains
- [ ] Database credentials protected
- [ ] Payment webhook secrets verified
- [ ] CORS configured properly
- [ ] Rate limiting enabled on API routes
- [ ] SQL injection prevention (Prisma ORM handles this)
- [ ] CSRF tokens enabled in forms

---

## 🆘 Troubleshooting

### Database Connection Error
```
Error: P1000 "Can't reach database server"
```
**Solution:**
- Verify `DATABASE_URL` format is correct
- Check database credentials
- Ensure IP whitelist allows deployment server

### Payment Provider Error
```
Error: "[provider] is not configured"
```
**Solution:**
- Verify API keys are set in environment variables
- Check provider API status
- For sandbox, ensure `*_ENV=sandbox` where applicable

### Build Failure
```
Error: "next: command not found"
```
**Solution:**
- Run `npm install --legacy-peer-deps`
- Ensure Node.js 18+ is installed
- Check `package.json` dependencies

### Webhook Not Receiving
**Solution:**
- Verify webhook URL in payment provider dashboard
- Ensure HTTPS is used
- Check firewall/security groups allow incoming webhooks
- Verify webhook secret matches environment variable

---

## 📊 Deployment Comparison Table

| Feature | Vercel | Railway | Hostgator |
|---------|--------|---------|-----------|
| Setup Time | 10 min | 15 min | 5 min |
| Cost | Free tier | $5/mo | $2.99-6.95/mo |
| Database Included | No | Yes | No |
| Auto-scaling | Yes | Yes | No |
| CI/CD | Built-in | Built-in | Manual |
| Performance | Excellent | Good | Fair |
| Next.js Optimized | Yes | Yes | No* |
| Dynamic APIs | Yes | Yes | Depends |
| Global CDN | Yes | No | No |

*Hostgator requires configuration for SSR/API routes

---

## 🎯 Next Steps After Deployment

1. **Test all payment methods** with sandbox credentials
2. **Set up monitoring** - Configure error tracking (Sentry, LogRocket)
3. **Enable logging** - Check deployment logs regularly
4. **Monitor performance** - Use platform-specific performance tools
5. **Set up backups** - Enable automated database backups
6. **Configure emails** - Set up Resend/SendGrid for notifications
7. **Update DNS** - Point custom domain to deployment URL

---

## 📞 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Railway Docs:** https://docs.railway.app
- **Hostgator Support:** https://support.hostgator.com
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs

---

**Last Updated:** August 15, 2026
**Platform Version:** Burch Platform v1.0
