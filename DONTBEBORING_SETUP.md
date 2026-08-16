# dontbeboring.com - Setup & Customization Guide

## Overview
This document outlines all necessary changes to transform Burch Platform into **dontbeboring.com** - a luxury experience platform for East Africa.

---

## 1. BRANDING CHANGES

### Color Palette
```
Primary: #1A2B4A (Dark Navy)
Accent: #D4AF37 (Gold)
Secondary: #2C5AA0 (Accent Blue)
Background: #F5F5F5 (Light Gray)
Text: #333333 (Dark Gray)
```

### Typography
- Headlines: Playfair Display (existing - luxury serif)
- Body: Inter (existing - clean sans-serif)
- CTA: Bold, uppercase

### Update Files:
- [ ] `apps/web/src/app/globals.css` - Update color variables
- [ ] `apps/web/tailwind.config.ts` - Add custom colors
- [ ] `apps/web/src/lib/ui-constants.ts` - Create color constants

---

## 2. DOMAIN & URLS

### Changes
```
Old: burch-platform.com (or localhost)
New: dontbeboring.com
API: api.dontbeboring.com
Admin: admin.dontbeboring.com
```

### Files to Update:
- [ ] `.env.example` - Update NEXTAUTH_URL, API_URL
- [ ] `.replit` - Update deployment URL
- [ ] `apps/web/next.config.ts` - Update redirects
- [ ] Email templates - Update unsubscribe links, brand references

---

## 3. CONTENT & COPY UPDATES

### Homepage
- [ ] Headline: "Discover Exceptional Experiences"
- [ ] Subheading: "Elevate your lifestyle with curated hotels, restaurants, and events across East Africa"
- [ ] CTA: "Explore" instead of generic
- [ ] Stats updated to match mockups

### Navigation
- [ ] Brand name: "dontbeboring"
- [ ] Menu items tailored to experience platform

### Pages
- [ ] About: "Who is dontbeboring?"
- [ ] Categories: Hotels, Restaurants, Events (not just events)
- [ ] Pricing: Transparent partner/user pricing

### Files to Update:
- [ ] `apps/web/src/app/page.tsx` - Homepage
- [ ] `apps/web/src/components/layout/NavBar.tsx` - Navigation
- [ ] `apps/web/src/app/layout.tsx` - Sitewide layout

---

## 4. COMPONENT REDESIGN

### Priority Components (by Figma):
1. **Header/Nav** - Dark navy with gold accents
2. **Hero Section** - Large image, overlay text, stats
3. **Category Cards** - Grid layout with emojis, counts
4. **Listing Cards** - Image, category badge, rating, CTA
5. **Footer** - Minimal, brand-focused

### Components to Create/Update:
- [ ] `CategoryBrowse` - New component
- [ ] `LuxuryListingCard` - New component
- [ ] `StatsSection` - New component
- [ ] `HeroSection` - Redesign
- [ ] `NavBar` - Rebrand colors/logo
- [ ] `Footer` - Rebrand

---

## 5. FEATURE CONFIGURATION

### Hotels Module
- [ ] Keep room bookings (inquiries format)
- [ ] Add luxury amenities filtering
- [ ] Update hotel onboarding for premium positioning

### Restaurants Module
- [ ] Keep reservation system
- [ ] Add cuisine type filtering
- [ ] Emphasis on fine dining experiences

### Events Module
- [ ] Keep ticket sales
- [ ] Add event category filtering
- [ ] VIP experience highlighting

### AI Concierge
- [ ] Retrain on luxury experiences
- [ ] Update personality (sophisticated, knowledgeable)
- [ ] Create "Experience Advisor" persona

---

## 6. DATABASE CUSTOMIZATION

### New Tables/Fields:
```sql
-- Add luxury tier to venues
ALTER TABLE hotels ADD COLUMN luxury_tier VARCHAR (gold, silver, bronze);
ALTER TABLE restaurants ADD COLUMN luxury_tier VARCHAR;
ALTER TABLE events ADD COLUMN experience_type VARCHAR;

-- Add amenities
ALTER TABLE hotels ADD COLUMN amenities JSONB;
ALTER TABLE restaurants ADD COLUMN cuisine_types TEXT[];

-- Track user preferences
ALTER TABLE users ADD COLUMN experience_preferences JSONB;
```

### Files to Update:
- [ ] `apps/web/prisma/schema.prisma` - Add new fields
- [ ] Create migration: `prisma migrate dev --name add_luxury_fields`

---

## 7. ADMIN & PARTNER DASHBOARD

### Partner Portal Features:
- [ ] Venue management (hotels/restaurants)
- [ ] Inventory/availability management
- [ ] Booking/reservation management
- [ ] Analytics & insights
- [ ] Review management
- [ ] Payment processing

### Admin Dashboard:
- [ ] Partner approval system
- [ ] Venue verification workflow
- [ ] Dispute resolution
- [ ] Platform analytics
- [ ] User management

### Files:
- [ ] `apps/web/src/app/partner/` - Redesign for luxury positioning
- [ ] `apps/web/src/app/admin/` - Create admin section

---

## 8. SEARCH & DISCOVERY

### Advanced Filters:
```
Hotels:
- Price range (budget to ultra-luxury)
- Star rating (3-5 stars)
- Amenities (spa, pool, gym, etc.)
- Distance from city center
- Recent reviews

Restaurants:
- Cuisine type (Italian, French, etc.)
- Price range (casual to fine dining)
- Ambiance (romantic, family-friendly, etc.)
- Dietary accommodations
- Reservation availability

Events:
- Category (concert, workshop, networking, etc.)
- Date range
- Price range
- Location
- Attendee count
```

### Files:
- [ ] `apps/web/src/components/SearchFilters.tsx` - New/updated
- [ ] `apps/web/src/lib/search.ts` - Search logic

---

## 9. PAYMENTS & TRANSACTIONS

### Payment Methods:
- [ ] M-Pesa (Kenya primary)
- [ ] Stripe (International)
- [ ] Flutterwave (Multi-country)

### Transaction Types:
- [ ] Hotel booking deposits (20-30%)
- [ ] Restaurant reservation holds (optional)
- [ ] Event ticket sales (full)
- [ ] Partner payouts

### Files:
- [ ] `apps/web/src/lib/payments/` - Keep existing, test with dontbeboring merchants

---

## 10. MARKETING & SEO

### SEO Setup:
```
Primary Keywords:
- "luxury experiences East Africa"
- "hotels Kenya Tanzania Uganda"
- "fine dining restaurants"
- "premium events"
- "boutique experiences"
```

### Open Graph:
- Title: "dontbeboring | Exceptional Experiences in East Africa"
- Description: "Curated luxury hotels, restaurants, and events"
- Image: Brand-consistent social card

### Files:
- [ ] `apps/web/src/app/layout.tsx` - Update metadata
- [ ] Create `public/og-image.png` - Social share image

---

## 11. EMAIL TEMPLATES

### Brand Updates:
- Logo: dontbeboring
- Colors: Navy + Gold
- Copy: Luxury, sophisticated tone
- CTA: Consistent branding

### Templates:
- [ ] Welcome email
- [ ] Booking confirmation
- [ ] Reservation confirmation
- [ ] Event ticket delivery
- [ ] Password reset
- [ ] Newsletter
- [ ] Promotional campaigns

### Files:
- [ ] `apps/web/src/lib/email.ts` - Update template logic
- [ ] Email service (Resend) - Update template designs

---

## 12. ENVIRONMENT VARIABLES

### Update `.env`:
```bash
# Brand
BRAND_NAME=dontbeboring
BRAND_URL=https://www.dontbeboring.com

# AI
ANTHROPIC_API_KEY=sk-... (Claude API)

# Payments
MPESA_BUSINESS_NAME=dontbeboring
FLUTTERWAVE_BUSINESS_NAME=dontbeboring

# Email
EMAIL_FROM="dontbeboring <hello@dontbeboring.com>"
RESEND_DOMAIN=dontbeboring.com

# Analytics
GOOGLE_ANALYTICS_ID=G-...
MIXPANEL_TOKEN=...
```

---

## 13. DEPLOYMENT CONFIGURATION

### Replit
```
[deployment]
deploymentTarget = "autoscale"
build = ["bash", "-c", "npm install && cd apps/web && npm run build"]
run = ["bash", "-c", "cd apps/web && npm run start"]

[env.production]
NEXTAUTH_URL=https://www.dontbeboring.com
BRAND_NAME=dontbeboring
```

### Alternative (Render/Vercel):
- Domain: dontbeboring.com
- Auto-deploy on main branch
- Environment variables configured

---

## 14. TESTING CHECKLIST

### Functional Testing:
- [ ] Homepage loads and displays correctly
- [ ] Category browsing works
- [ ] Search filters function
- [ ] User registration/login
- [ ] Hotel booking flow
- [ ] Restaurant reservation flow
- [ ] Event ticket purchase
- [ ] Payment processing
- [ ] Admin dashboard
- [ ] Partner dashboard

### Performance:
- [ ] Page load < 3 seconds
- [ ] Mobile responsive
- [ ] SEO optimized (Lighthouse)
- [ ] No console errors

### Security:
- [ ] No XSS vulnerabilities
- [ ] CSRF protection enabled
- [ ] Rate limiting active
- [ ] Sensitive data encrypted

---

## 15. LAUNCH CHECKLIST

### Pre-Launch:
- [ ] All branding complete
- [ ] Testing passed
- [ ] Partners onboarded (50+)
- [ ] Marketing content ready
- [ ] Analytics configured
- [ ] Backup system ready
- [ ] Support documentation written

### Launch:
- [ ] Domain goes live
- [ ] Press release published
- [ ] Social media campaign starts
- [ ] Email campaigns sent
- [ ] Monitor error logs
- [ ] Track user engagement

### Post-Launch:
- [ ] Monitor performance metrics
- [ ] Gather user feedback
- [ ] Fix bugs/issues
- [ ] Plan improvements

---

## Implementation Order

**Phase 1 (Days 1-3):**
1. Branding setup (colors, typography)
2. Domain configuration
3. Homepage redesign

**Phase 2 (Days 4-7):**
4. Component updates
5. Content updates
6. Database customization

**Phase 3 (Days 8-14):**
7. Feature enhancements
8. Admin/Partner dashboards
9. Search improvements

**Phase 4 (Days 15-21):**
10. Payments testing
11. Email template updates
12. SEO optimization

**Phase 5 (Days 22-28):**
13. Full testing
14. Partner onboarding
15. Marketing launch

---

## Support & Questions

For questions about specific implementations, check:
- Figma designs: Design system and component specs
- API docs: Backend integration details
- Partner guide: Onboarding workflows

