# Henna Studio - Deployment Guide

## Prerequisites
- Node.js 18+
- Angular CLI 21+
- A Supabase account with a project created
- (Optional) Google Maps API key for location pin feature

---

## Step 1: Configure Supabase

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region (closest to Pakistan: `ap-south-1` Mumbai or `ap-southeast-1` Singapore)

### 1.2 Run Database Migrations
In **Supabase Dashboard → SQL Editor**, run the migration files in order:

```sql
-- Paste and run each file separately:
-- supabase/migrations/001_schema.sql  (tables, functions, triggers)
-- supabase/migrations/002_rls.sql     (row-level security policies)
-- supabase/migrations/003_storage.sql (storage buckets & policies)
-- supabase/seed.sql                   (seed data: packages, add-ons, products, settings)
```

### 1.3 Get Supabase Credentials
Dashboard → Settings → API:
- **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
- **Anon (public) key**: `eyJhbGc...`

### 1.4 Create First Admin User
1. Build and run the app (see Step 3)
2. Register at `/auth/register`
3. In Supabase → Table Editor → `profiles` → find your row → change `role` from `client` to `admin`

---

## Step 2: Configure Environment

Edit `src/environments/environment.ts` (development) and `src/environments/environment.prod.ts` (production):

```typescript
export const environment = {
  production: false,                          // true for prod
  supabaseUrl: 'https://xxxx.supabase.co',   // your Project URL
  supabaseAnonKey: 'eyJhbGc...',              // your Anon key
  googleMapsApiKey: 'AIzaSy...',              // optional, for map pin
};
```

---

## Step 3: Local Development

```bash
npm install
ng serve
# App available at http://localhost:4200
```

---

## Step 4: Build for Production

```bash
ng build
# Output: dist/mehndi-app/browser/
```

---

## Step 5: Deploy to Vercel (Recommended)

### 5.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 5.2 Create `vercel.json`
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/ngsw-worker.js",
      "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
    }
  ]
}
```

### 5.3 Set Environment Variables in Vercel
Vercel Dashboard → Project → Settings → Environment Variables:
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
GOOGLE_MAPS_KEY=AIzaSy...
```

**Note:** Since Angular uses build-time variables, you must rebuild after changing env vars. Alternatively, bake them into `environment.prod.ts` before building.

### 5.4 Deploy
```bash
vercel --prod
```

---

## Step 6: Deploy to Netlify (Alternative)

Create `public/_redirects`:
```
/*  /index.html  200
```

```bash
netlify deploy --dir=dist/mehndi-app/browser --prod
```

---

## Step 7: Configure Google Maps (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Maps JavaScript API
3. Create an API key → restrict to your domain
4. Add to `environment.ts` and `environment.prod.ts`
5. Add to `index.html` (if using script tag approach) or configure via `@angular/google-maps` provider

---

## Step 8: Configure Supabase Auth Settings

Dashboard → Authentication → Settings:
- **Site URL**: `https://your-domain.com`
- **Redirect URLs**: `https://your-domain.com/auth/login`
- **Email confirmations**: Optional (disable for easier testing)

---

## Production Checklist

- [ ] Supabase project URL and anon key set in `environment.prod.ts`
- [ ] All 3 SQL migrations run successfully
- [ ] Seed data applied (`supabase/seed.sql`)
- [ ] Admin user role set in `profiles` table
- [ ] Storage buckets created (artist-photos, payment-receipts)
- [ ] Domain configured in Supabase Auth settings
- [ ] PWA manifest theme color matches branding
- [ ] Google Maps API key set (if using location pin)
- [ ] `ng build` completes with no errors
- [ ] App loads and auth flow works (register → confirm → login)

---

## Updating Admin User

```sql
-- In Supabase SQL Editor
UPDATE profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@yourdomain.com');
```

---

## Database Backup

Supabase provides automatic daily backups on Pro plan. For free tier, export manually:

```bash
# Using Supabase CLI
supabase db dump --file backup.sql
```

---

## Support

For issues with the Angular app, check the browser console and network tab.
For Supabase RLS issues, check Dashboard → Logs → API logs.
