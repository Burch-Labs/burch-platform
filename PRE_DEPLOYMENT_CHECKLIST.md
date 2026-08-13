# ✅ Pre-Deployment Checklist (Final Verification)

**Use this 5-minute checklist RIGHT BEFORE clicking "Create Web Service" on Render**

---

## 🔐 Credentials Verified

- [ ] DATABASE_URL copied from [RENDER_ENV_VARS.txt](RENDER_ENV_VARS.txt) → Neon connection string with `?sslmode=require`
- [ ] NEXTAUTH_SECRET copied → cryptographically secure random string
- [ ] NEXTAUTH_URL set to → `https://burch-platform.onrender.com` (or your custom domain)
- [ ] RESEND_API_KEY copied → real API key from Resend dashboard
- [ ] EMAIL_FROM copied → `Burch Platform <onboarding@resend.dev>` (or your domain)
- [ ] EMAIL_OVERRIDE_TO set → `sparksnairobi@gmail.com` (for testing before going live)

---

## 💳 Payment Credentials (Sandbox Mode)

- [ ] MPESA_ENV set to → `sandbox` (will change to `production` after testing)
- [ ] MPESA_CONSUMER_KEY copied → from Daraja portal
- [ ] MPESA_CONSUMER_SECRET copied → from Daraja portal
- [ ] MPESA_PASSKEY copied → from Daraja portal
- [ ] MPESA_SHORTCODE set to → `174379` (sandbox test code)
- [ ] FLUTTERWAVE_SECRET_KEY copied → from Flutterwave dashboard
- [ ] FLUTTERWAVE_SECRET_HASH copied → from Flutterwave dashboard

---

## 🏗️ Render Configuration

- [ ] **Repository:** Connected to `Burch-Labs/burch-platform`
- [ ] **Service Name:** `burch-platform`
- [ ] **Environment:** `Node`
- [ ] **Build Command:** `npm install && cd apps/web && npm run build`
- [ ] **Start Command:** `cd apps/web && npm start`
- [ ] **Instance Type:** **Free** (512 MB RAM is sufficient for MVP)
- [ ] **All environment variables added** (copy-paste from [RENDER_ENV_VARS.txt](RENDER_ENV_VARS.txt))

---

## 🗄️ Database Setup

- [ ] Neon account created at https://neon.tech
- [ ] New project created in Neon
- [ ] Database URL tested and verified
- [ ] SSL mode enabled in connection string (`?sslmode=require`)

---

## 📋 After Deployment (Next 5 Minutes)

1. [ ] Deployment shows **green checkmark** (wait 3-5 min)
2. [ ] Click **Shell** tab in your service
3. [ ] Run command: `cd apps/web && npm run db:push`
4. [ ] Wait for ✅ success message

---

## 🧪 Quick Smoke Test (After DB Initialized)

```bash
# Test health endpoint
curl https://burch-platform.onrender.com/api/health

# Expected response:
# {"status":"ok"}
```

Open in browser: `https://burch-platform.onrender.com`

- [ ] Homepage loads without errors
- [ ] Can navigate to Events page
- [ ] Can navigate to Hotels page
- [ ] Can navigate to Restaurants page

---

## ⚠️ DO NOT FORGET

- [ ] ❌ Do NOT commit environment variables to git
- [ ] ❌ Do NOT share credentials in messages/emails (they're already sensitive)
- [ ] ❌ Do NOT set `MPESA_ENV=production` yet (test first)
- [ ] ❌ Do NOT remove `EMAIL_OVERRIDE_TO` until ready for real users
- [ ] ✅ DO create account and test each feature thoroughly

---

## 📊 Deployment Status

| Step | Status | Time |
|------|--------|------|
| Create Render account | ⏳ | 2 min |
| Configure service | ⏳ | 5 min |
| Add environment variables | ⏳ | 3 min |
| Wait for deployment | ⏳ | 3-5 min |
| Run database migration | ⏳ | 2 min |
| Smoke tests | ⏳ | 5 min |
| **TOTAL TIME TO LAUNCH** | **~20 minutes** | |

---

## 🎯 Success Criteria

You're ready to launch when ALL of these pass:

✅ Render shows green checkmark  
✅ Health check returns `{"status":"ok"}`  
✅ Homepage loads in browser  
✅ Can create user account  
✅ Can browse events/hotels/restaurants  
✅ Can initiate payment (sandbox)  
✅ Receive confirmation email  

**Once all green: Your platform is LIVE! 🚀**

---

## 🔄 Next Steps After Launch

1. **Test with real payments** (small amount: $0.01)
2. **Monitor error logs** (check Render dashboard)
3. **Get real domain** (purchase burch.app, .co.ke, etc.)
4. **Switch payment credentials to LIVE**
5. **Set EMAIL_OVERRIDE_TO empty** to stop redirecting emails
6. **Update NEXTAUTH_URL** to custom domain
7. **Redeploy after changes**

---

**Remember:** Test in sandbox FIRST. Real payments come after everything works perfectly.

Good luck! 🎉
