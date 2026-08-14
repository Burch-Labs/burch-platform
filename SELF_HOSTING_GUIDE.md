# 🚀 Self-Hosting Guide - Burch Platform

Complete guide to download and self-host the Burch Platform on your own server.

---

## 📋 Prerequisites

You need:
- **Node.js 20+** (https://nodejs.org)
- **PostgreSQL 14+** (https://postgresql.org)
- **NPM or Yarn** (comes with Node.js)
- A server/VPS with at least **1GB RAM, 10GB disk**

---

## 📥 Step 1: Download the Application

### Option A: Clone from GitHub (Recommended)

```bash
git clone https://github.com/Burch-Labs/burch-platform.git
cd burch-platform
```

### Option B: Download as ZIP

1. Go to **https://github.com/Burch-Labs/burch-platform**
2. Click **Code** → **Download ZIP**
3. Extract the ZIP file
4. Open terminal in the extracted folder

---

## ⚙️ Step 2: Set Up Environment Variables

Create `.env.local` in the root directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/burch_platform

# Authentication
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=https://your-domain.com

# Email Service (Resend)
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=Burch Platform <noreply@your-domain.com>

# Payment: M-Pesa
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_PASSKEY=your_passkey
MPESA_SHORTCODE=174379

# Payment: Flutterwave
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_your_key
FLUTTERWAVE_SECRET_HASH=your_hash

# Optional: AI Features
ANTHROPIC_API_KEY=your_key

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
```

---

## 🗄️ Step 3: Set Up PostgreSQL Database

### On Linux/Mac:

```bash
# Create database
createdb burch_platform

# Set password for user (optional, replace 'postgres')
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'your_secure_password';"
```

### On Windows:

1. Open PostgreSQL admin tool (pgAdmin)
2. Create new database: `burch_platform`
3. Note the connection details

Update `DATABASE_URL` in `.env.local`:
```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/burch_platform
```

---

## 📦 Step 4: Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm ci
```

---

## 🗃️ Step 5: Initialize Database

```bash
cd apps/web
npm run db:push
```

This applies all database migrations. If you want sample data:

```bash
npm run db:seed
```

---

## 🏗️ Step 6: Build the Application

```bash
npm run build
```

This creates an optimized production build in `apps/web/.next/`

---

## 🚀 Step 7: Run the Application

### Development Mode (Testing):

```bash
npm run dev
```

Visit: **http://localhost:5000**

### Production Mode (Deployment):

```bash
cd apps/web
npm start
```

Visit: **http://localhost:3000**

---

## 🌐 Step 8: Deploy to Your Server

### Option A: Deploy on Linux VPS (Recommended)

#### Using PM2 (process manager):

```bash
# Install PM2 globally
npm install -g pm2

# Start app with PM2
cd apps/web
pm2 start "npm start" --name "burch-platform"

# Make it auto-start on reboot
pm2 startup
pm2 save
```

#### Using Systemd (alternative):

Create `/etc/systemd/system/burch-platform.service`:

```ini
[Unit]
Description=Burch Platform
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/username/burch-platform/apps/web
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable burch-platform
sudo systemctl start burch-platform
```

### Option B: Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

WORKDIR /app/apps/web

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t burch-platform .
docker run -p 3000:3000 -e DATABASE_URL="..." burch-platform
```

### Option C: Deploy on Cloud Providers

#### Heroku:
```bash
npm install -g heroku
heroku login
heroku create burch-platform
git push heroku main
```

#### DigitalOcean App Platform:
1. Connect GitHub repo
2. Select `apps/web` as root directory
3. Add environment variables
4. Deploy

#### AWS, Google Cloud, Azure:
Refer to their Next.js deployment guides.

---

## 🔗 Step 9: Set Up Reverse Proxy (Production)

Use **Nginx** to proxy requests to your Node.js app:

Create `/etc/nginx/sites-available/burch-platform`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/burch-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Step 10: Set Up HTTPS (SSL Certificate)

Use Let's Encrypt (free):

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🧪 Step 11: Test Deployment

1. Visit your domain: **https://your-domain.com**
2. Check health: **https://your-domain.com/api/health**
3. Try features:
   - Sign up with email
   - Browse events/hotels
   - Test M-Pesa payment (sandbox)
   - View digital ticket

---

## 🚨 Troubleshooting

### Database connection error:
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Build fails:
```bash
# Clear cache and rebuild
rm -rf node_modules apps/web/.next apps/web/node_modules
npm ci
npm run build
```

### App won't start:
```bash
# Check logs
pm2 logs burch-platform

# Or systemd:
sudo journalctl -u burch-platform -f
```

### Port already in use:
```bash
# Change port in apps/web/package.json:
"start": "next start -p 8080"
```

---

## 📊 Monitoring & Maintenance

### Monitor with PM2:
```bash
pm2 monit
pm2 logs
pm2 status
```

### Backup database regularly:
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Update dependencies:
```bash
npm update
npm run build
pm2 restart burch-platform
```

---

## 🔧 Environment Variables Checklist

- [ ] DATABASE_URL (PostgreSQL connection)
- [ ] NEXTAUTH_SECRET (random string)
- [ ] NEXTAUTH_URL (your domain)
- [ ] RESEND_API_KEY (email service)
- [ ] MPESA credentials (all 4: KEY, SECRET, PASSKEY, SHORTCODE)
- [ ] FLUTTERWAVE credentials (KEY + HASH)
- [ ] EMAIL_FROM (sender email)

---

## 📝 Important Notes

1. **Never commit `.env.local`** to git — it contains secrets
2. **Use strong NEXTAUTH_SECRET** — this secures user sessions
3. **Enable HTTPS** in production — critical for payment security
4. **Back up your database** — before any updates
5. **Monitor logs** — watch for errors and security issues
6. **Update Node.js regularly** — for security patches
7. **Keep PostgreSQL updated** — regular security updates

---

## 🆘 Need Help?

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs
- **GitHub Issues**: https://github.com/Burch-Labs/burch-platform/issues

---

## ✅ Deployment Checklist

- [ ] Clone/download repository
- [ ] Create `.env.local` with all variables
- [ ] Set up PostgreSQL database
- [ ] Run `npm install && npm run db:push`
- [ ] Test locally: `npm run dev`
- [ ] Build for production: `npm run build`
- [ ] Deploy to server/VPS
- [ ] Set up reverse proxy (Nginx)
- [ ] Configure HTTPS/SSL
- [ ] Test on production URL
- [ ] Set up monitoring (PM2/systemd)
- [ ] Configure backups
- [ ] Document your deployment

---

**You're ready to self-host! 🚀**

For questions about your specific server setup, consult your hosting provider's documentation.
