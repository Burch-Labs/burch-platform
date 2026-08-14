# 📥 Download & Package Instructions

## Quick Start: Download the Complete App

### Method 1: Clone from GitHub (Recommended)

```bash
git clone https://github.com/Burch-Labs/burch-platform.git
cd burch-platform
```

This gives you the latest code with full git history.

---

### Method 2: Download as ZIP

1. Go to: **https://github.com/Burch-Labs/burch-platform**
2. Click **Code** (green button)
3. Select **Download ZIP**
4. Extract the ZIP to your desired location
5. Open terminal in the extracted folder

---

### Method 3: Download as TAR.GZ

```bash
wget https://github.com/Burch-Labs/burch-platform/archive/refs/heads/main.tar.gz
tar -xzf main.tar.gz
cd burch-platform-main
```

---

## 📦 What You Get

The download includes:

```
burch-platform/
├── apps/
│   └── web/                    # Next.js application
│       ├── src/
│       │   ├── app/            # Routes & pages
│       │   ├── components/     # React components
│       │   ├── lib/            # Utilities & API
│       │   └── styles/         # Tailwind CSS
│       ├── prisma/             # Database schema
│       ├── public/             # Static assets
│       └── package.json
├── packages/                   # Shared libraries (if any)
├── .env.example               # Environment variables template
├── package.json               # Root configuration
├── SELF_HOSTING_GUIDE.md      # How to deploy
└── DEPLOYMENT.md              # Environment setup details
```

---

## 🚀 Next Steps After Download

1. **Read** `SELF_HOSTING_GUIDE.md` (comprehensive deployment guide)
2. **Create** `.env.local` file with your credentials
3. **Set up** PostgreSQL database
4. **Run** `npm install`
5. **Run** `npm run db:push`
6. **Test** locally with `npm run dev`
7. **Deploy** to your server

---

## 📋 Files to Know

| File | Purpose |
|------|---------|
| `.env.local` | Your secrets (create this) |
| `SELF_HOSTING_GUIDE.md` | Step-by-step deployment |
| `DEPLOYMENT.md` | Environment variables reference |
| `QUICK_START.md` | Quick reference guide |
| `RENDER_DEPLOYMENT.md` | Deploy to Render (if using) |

---

## 🔐 Important Before Deploying

1. **Never commit `.env.local`** — it contains secrets
2. **Keep PostgreSQL password secure** — use strong password
3. **Use HTTPS in production** — critical for payments
4. **Generate new NEXTAUTH_SECRET** for production:
   ```bash
   openssl rand -base64 32
   ```
5. **Keep backups** — regular database backups

---

## 💾 Create Your Own Zip Package

If you want to package the app as a ZIP to share or backup:

### On Linux/Mac:

```bash
cd burch-platform
zip -r burch-platform.zip . -x "node_modules/*" ".git/*" ".env*" ".next/*"
```

### On Windows:

1. Right-click folder → Send to → Compressed folder
2. Or use 7-Zip: Right-click → 7-Zip → Add to archive

---

## 📦 ZIP Size Expected

- **With node_modules**: ~1.5GB
- **Without node_modules**: ~50MB (recommended for sharing)
- **Built app only**: ~200MB

**Recommended**: Download, then run `npm install` on your server.

---

## ✅ Verification Checklist

After download, verify you have:

- [ ] `apps/web/src/` (source code)
- [ ] `apps/web/prisma/` (database schema)
- [ ] `package.json` (root config)
- [ ] `apps/web/package.json` (app config)
- [ ] `SELF_HOSTING_GUIDE.md` (deployment guide)
- [ ] `.env.example` (template)

---

## 🎯 Where to Deploy

**Free options:**
- Render (free tier)
- Railway (free tier)
- Fly.io (free tier)

**Paid options:**
- DigitalOcean ($5/month+)
- Heroku ($7/month+)
- AWS, Google Cloud, Azure

See `SELF_HOSTING_GUIDE.md` for deployment instructions for each.

---

## 🆘 Support

- **Docs**: See `SELF_HOSTING_GUIDE.md`
- **Issues**: https://github.com/Burch-Labs/burch-platform/issues
- **Questions**: Check the guides first

---

**Ready to download?** 

Go to: https://github.com/Burch-Labs/burch-platform

Click **Code** → **Download ZIP** (or clone with git)

Then follow `SELF_HOSTING_GUIDE.md` for deployment! 🚀
