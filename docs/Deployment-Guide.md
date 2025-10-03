# Deployment Guide

Complete guide for deploying the Leave Management System to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Vercel Deployment](#vercel-deployment)
4. [Netlify Deployment](#netlify-deployment)
5. [Environment Variables](#environment-variables)
6. [Database Migrations](#database-migrations)
7. [Edge Functions Deployment](#edge-functions-deployment)
8. [Post-Deployment Checklist](#post-deployment-checklist)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] Node.js 18+ installed locally
- [ ] Git repository with latest code
- [ ] Supabase account
- [ ] Vercel or Netlify account
- [ ] Domain name (optional but recommended)
- [ ] Email service provider account (SendGrid/Mailgun)

---

## Supabase Setup

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and project name
4. Select region closest to your users
5. Generate strong database password
6. Wait for project provisioning (~2 minutes)

### 2. Configure Database

#### Run Migrations

```bash
cd backend

# Link to your Supabase project
npx supabase link --project-ref your-project-ref

# Push migrations to production
npx supabase db push

# Verify migrations
npx supabase db reset --linked
```

#### Enable Required Extensions

Navigate to Database → Extensions in Supabase dashboard and enable:

- [x] `uuid-ossp` - UUID generation
- [x] `pgcrypto` - Cryptographic functions
- [x] `pg_stat_statements` - Query performance tracking

### 3. Configure Authentication

Navigate to Authentication → Settings:

**Site URL:**
```
https://your-domain.com
```

**Redirect URLs:**
```
https://your-domain.com/auth/callback
https://your-domain.com/dashboard
```

**Email Auth Settings:**
- Enable email confirmations
- Set email templates (use templates from `/design/email-templates/`)
- Configure SMTP (or use Supabase's built-in service)

**Security:**
- Enable Captcha for signup
- Set JWT expiry to 3600 seconds (1 hour)
- Enable refresh token rotation

### 4. Configure Storage

Navigate to Storage → Settings:

1. Create buckets:
   - `documents` - For company documents
   - `avatars` - For user profile photos

2. Set storage policies:

```sql
-- Public read for public documents
CREATE POLICY "Public documents are viewable by authenticated users"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'public'
);

-- Authenticated users can upload documents
CREATE POLICY "HR can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('hr', 'admin')
  )
);
```

### 5. Get API Keys

Navigate to Settings → API:

Copy these values for deployment:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

---

## Vercel Deployment

### Option 1: Deploy via Vercel Dashboard

1. Go to [https://vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Configure project:

```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

5. Add environment variables (see [Environment Variables](#environment-variables))
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Vercel Configuration

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  },
  "build": {
    "env": {
      "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

### Custom Domain

1. Navigate to Settings → Domains
2. Add your domain: `your-domain.com`
3. Configure DNS records as shown
4. Wait for SSL certificate provisioning (~5 minutes)

---

## Netlify Deployment

### Option 1: Deploy via Netlify Dashboard

1. Go to [https://netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to Git repository
4. Configure build settings:

```
Build command: npm run build
Publish directory: .next
```

5. Add environment variables
6. Click "Deploy site"

### Option 2: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy to production
netlify deploy --prod
```

### Netlify Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    X-XSS-Protection = "1; mode=block"
```

---

## Environment Variables

### Production Environment Variables

Create the following environment variables in your deployment platform:

**Public Variables** (Vercel/Netlify dashboard):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**Secret Variables** (Vercel/Netlify dashboard - encrypted):
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SENDGRID_API_KEY=your-sendgrid-api-key
SENTRY_DSN=your-sentry-dsn
DATABASE_URL=postgresql://user:pass@host:port/db
```

### Environment Variable Security

**⚠️ NEVER commit these to Git:**
- Service role keys
- API keys
- Database passwords
- JWT secrets

**Use secret management:**
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables
- Supabase: Dashboard → Settings → API

---

## Database Migrations

### Pre-Deployment Migration Check

```bash
# Verify migrations locally first
cd backend
npx supabase db reset

# Check for pending migrations
npx supabase migration list

# Test migrations
npm run test:integration
```

### Production Migration

```bash
# Backup production database first!
npx supabase db dump -f backup-$(date +%Y%m%d).sql

# Push migrations to production
npx supabase db push --linked

# Verify migration success
npx supabase migration list --linked
```

### Migration Rollback

If a migration fails:

```bash
# Restore from backup
npx supabase db restore backup-20240115.sql

# Remove failed migration
git revert <commit-hash>

# Fix migration and redeploy
```

---

## Edge Functions Deployment

### Deploy All Edge Functions

```bash
cd backend

# Deploy all functions
npx supabase functions deploy

# Deploy specific function
npx supabase functions deploy approve-leave
```

### Configure Scheduled Functions

For document expiry checking:

```bash
# Set up cron job in Supabase dashboard
# Navigate to Edge Functions → check-document-expiry → Settings

# Schedule: Daily at 9 AM UTC
0 9 * * *
```

### Environment Variables for Edge Functions

Add in Supabase Dashboard → Edge Functions → Settings:

```env
SENDGRID_API_KEY=your-api-key
APP_URL=https://your-domain.com
```

---

## Post-Deployment Checklist

### Immediate Checks (< 5 minutes)

- [ ] Website loads at production URL
- [ ] SSL certificate is valid (green padlock)
- [ ] Login functionality works
- [ ] Registration creates new user
- [ ] Dashboard loads for authenticated user
- [ ] API endpoints respond correctly
- [ ] Static assets load (images, fonts, CSS)

### Functional Tests (< 30 minutes)

- [ ] Create leave request
- [ ] Manager can approve/reject
- [ ] Document upload works
- [ ] Email notifications send (check spam folder)
- [ ] User roles enforced correctly
- [ ] Database queries perform well (<100ms)
- [ ] Mobile responsiveness verified

### Performance Tests

```bash
# Run Lighthouse audit
npx lighthouse https://your-domain.com --view

# Check Core Web Vitals
# Should see:
# - LCP < 2.5s
# - FID < 100ms
# - CLS < 0.1
```

### Security Checks

- [ ] HTTPS enforced (no HTTP access)
- [ ] Security headers present (check with securityheaders.com)
- [ ] RLS policies active (test with different roles)
- [ ] Service role key not exposed in client
- [ ] CORS configured correctly
- [ ] Rate limiting active

### Monitoring Setup

1. **Sentry Error Tracking:**
```bash
# Add Sentry integration
npm install @sentry/nextjs

# Configure in next.config.js
```

2. **Supabase Monitoring:**
   - Enable Database Webhooks
   - Set up query performance tracking
   - Configure alert thresholds

3. **Uptime Monitoring:**
   - Set up UptimeRobot or similar
   - Monitor: `/` and `/api/health`
   - Alert on: >5 minute downtime

---

## Monitoring & Maintenance

### Daily Checks

- [ ] Error rate < 0.1%
- [ ] Response time < 500ms (p95)
- [ ] Database CPU < 70%
- [ ] Storage usage < 80%

### Weekly Maintenance

```bash
# Update dependencies
npm update
npm audit fix

# Review error logs
npx supabase logs --project-ref your-ref

# Check database performance
# Supabase Dashboard → Database → Query Performance
```

### Monthly Maintenance

- [ ] Review and rotate API keys
- [ ] Database vacuum and analyze
- [ ] Review user access audit logs
- [ ] Update documentation
- [ ] Backup verification test

### Backup Strategy

**Automated Daily Backups:**
```bash
# Supabase provides automatic daily backups
# Navigate to Database → Backups to verify

# Additional manual backup
npx supabase db dump -f backups/backup-$(date +%Y%m%d).sql
```

**Backup Retention:**
- Daily: 7 days
- Weekly: 4 weeks
- Monthly: 12 months

---

## Troubleshooting

### Build Failures

**Issue:** Build fails on Vercel/Netlify

```bash
# Common causes:
1. TypeScript errors
   → Run: npm run type-check

2. Missing environment variables
   → Verify all required vars are set

3. Dependency conflicts
   → Run: npm ci (clean install)

4. Out of memory
   → Increase Node memory: NODE_OPTIONS=--max-old-space-size=4096
```

### Database Connection Issues

```bash
# Test database connection
npx supabase db ping

# Check RLS policies
npx supabase db inspect rls

# View active connections
npx supabase db ps
```

### Email Not Sending

1. Check SMTP configuration in Supabase Auth settings
2. Verify SendGrid API key is valid
3. Check email logs: Supabase Dashboard → Authentication → Logs
4. Test email deliverability with temp email service

### Performance Issues

```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer

# Check database queries
# Supabase Dashboard → Database → Query Performance

# Review slow API endpoints
# Add logging to identify bottlenecks
```

### 500 Internal Server Error

1. Check Vercel/Netlify function logs
2. Review Supabase Edge Function logs
3. Check database connection pool
4. Verify environment variables are correct
5. Review recent code deployments

---

## Rollback Procedure

If deployment causes critical issues:

### Vercel Rollback

```bash
# Via Dashboard
1. Go to Deployments
2. Find last stable deployment
3. Click "..." → Promote to Production

# Via CLI
vercel rollback
```

### Netlify Rollback

```bash
# Via Dashboard
1. Go to Deploys
2. Find last stable deploy
3. Click "Publish deploy"

# Via CLI
netlify rollback
```

### Database Rollback

```bash
# Restore from backup
npx supabase db restore backup-20240115.sql

# Verify restoration
npx supabase db ping
```

---

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Netlify Docs:** https://docs.netlify.com
- **Next.js Docs:** https://nextjs.org/docs

For deployment issues:
- Create issue in project repository
- Contact team lead
- Check Supabase community: https://github.com/supabase/supabase/discussions

---

## Production URL

After successful deployment, your application will be available at:

**Vercel:** `https://your-project.vercel.app` or custom domain
**Netlify:** `https://your-project.netlify.app` or custom domain

Configure custom domain for professional appearance and SEO benefits.
