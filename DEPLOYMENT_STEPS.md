# Deployment Guide

## ✅ Build Status
- Next.js build: **SUCCESS**
- 149 pages generated
- 0 TypeScript errors
- Production bundle optimized

## Deploy to Vercel (Recommended)

### Step 1: Login
```powershell
vercel login
```

### Step 2: Deploy
```powershell
vercel --prod
```

### Step 3: Set Environment Variables
In Vercel dashboard, add:
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your production URL (e.g., https://your-app.vercel.app)
- `REDIS_URL` - Your Redis connection string
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_PUBLIC_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `EMAIL_SERVER_HOST`
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM`

### Step 4: Redeploy
After adding environment variables, trigger a redeploy:
```powershell
vercel --prod
```

## Alternative: GitHub + Vercel

### Step 1: Push to GitHub
```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/dkee.git
git push -u origin main
```

### Step 2: Connect to Vercel
1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Add environment variables
5. Deploy!

## Mobile Apps (APK Build)

### Prerequisites
```powershell
npm install -g eas-cli
eas login
```

### Build Customer App
```powershell
cd mobile/customer-app
eas build --platform android --profile production
```

### Build Staff App
```powershell
cd mobile/staff-app
eas build --platform android --profile production
```

### Download & Host APKs
1. EAS will provide download URLs
2. Download APK files
3. Place in `public/downloads/`
4. Commit and redeploy Next.js app

## Post-Deployment Checklist

- [ ] Test login at `/login`
- [ ] Create admin account
- [ ] Test customer registration
- [ ] Configure Cloudinary media
- [ ] Test payment integration
- [ ] Set up cron jobs (Vercel Cron or external)
- [ ] Configure email templates
- [ ] Test mobile apps download
- [ ] Enable analytics
- [ ] Set up monitoring (Sentry already configured)

## Database Migration

Your database is already synced! If you need to re-run:
```powershell
npx prisma migrate deploy
```

## Performance Optimization

Already configured:
- ✅ Redis caching
- ✅ Image optimization (Cloudinary)
- ✅ Static page generation
- ✅ API route optimization
- ✅ Gzip compression

## Domain Setup

1. Add custom domain in Vercel dashboard
2. Update `NEXTAUTH_URL` environment variable
3. Configure DNS:
   - A record: 76.76.21.21
   - CNAME: cname.vercel-dns.com

## Monitoring

- Sentry configured for error tracking
- Vercel Analytics enabled
- Check logs: `vercel logs`

## Support

- Vercel docs: https://vercel.com/docs
- Next.js docs: https://nextjs.org/docs
- Project structure: See PROJECT_STRUCTURE.md
