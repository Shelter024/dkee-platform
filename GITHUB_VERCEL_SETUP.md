# GitHub Setup & Automatic Deployment Guide

## Step 1: Initialize Git Repository

```powershell
# Initialize git (if not already done)
git init

# Check status
git status
```

## Step 2: Create .gitignore (Already exists, verify it includes)

```
node_modules/
.next/
.env
.env*.local
dist/
build/
*.log
.DS_Store
.vercel
mobile/customer-app/node_modules/
mobile/staff-app/node_modules/
```

## Step 3: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `dkee-platform` (or your choice)
3. Description: "DK Executive Engineers - Full Stack Management Platform"
4. Choose "Private" or "Public"
5. **DO NOT** initialize with README (you already have one)
6. Click "Create repository"

## Step 4: Add All Files to Git

```powershell
# Add all files
git add .

# Check what will be committed
git status

# Create initial commit
git commit -m "Initial commit: Full platform with mobile apps"
```

## Step 5: Connect to GitHub

```powershell
# Add remote (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/dkee-platform.git

# Verify remote
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 6: Connect GitHub to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click "Add New" > "Project"
3. Click "Import Git Repository"
4. Select your GitHub repository
5. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next
   - **Install Command**: `npm install`

6. Add Environment Variables (click "Environment Variables"):
   - Copy all from `.env.example`
   - Fill in production values
   - Enable for "Production", "Preview", and "Development"

7. Click "Deploy"

### Option B: Via Vercel CLI

```powershell
# Link project to Vercel
vercel link

# Deploy
vercel --prod
```

## Step 7: Configure Automatic Deployments

Once connected, Vercel automatically:
- ✅ Deploys on every push to `main` branch
- ✅ Creates preview deployments for pull requests
- ✅ Runs build checks before deploying
- ✅ Invalidates cache when needed

### Branch Protection (Optional but Recommended)

1. Go to GitHub repository > Settings > Branches
2. Add rule for `main` branch:
   - ☑ Require pull request before merging
   - ☑ Require status checks to pass (Vercel build)
   - ☑ Require deployments to succeed before merging

## Step 8: Set Up Branch Workflow

```powershell
# Create development branch
git checkout -b development

# Make changes and commit
git add .
git commit -m "Your changes"

# Push development branch
git push origin development

# Create pull request on GitHub
# After review and Vercel preview, merge to main
```

## Step 9: Deploy Workflow

### For Features/Fixes:
```powershell
# 1. Create feature branch
git checkout -b feature/loyalty-points

# 2. Make changes
# ... code changes ...

# 3. Commit
git add .
git commit -m "Add loyalty points feature"

# 4. Push to GitHub
git push origin feature/loyalty-points

# 5. Create Pull Request on GitHub
# 6. Vercel creates preview deployment
# 7. Review preview at: https://dkee-platform-git-feature-loyalty-points.vercel.app
# 8. Merge PR to main
# 9. Auto-deploys to production
```

## Step 10: Environment Variables Management

### Add New Environment Variable:
1. Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add variable
3. Select environments (Production/Preview/Development)
4. Click "Save"
5. Redeploy: Dashboard > Deployments > Latest > ... > Redeploy

### Update Existing Variable:
1. Delete old variable
2. Add new variable with updated value
3. Redeploy

## Step 11: Custom Domain Setup

1. Vercel Dashboard > Your Project > Settings > Domains
2. Add domain (e.g., `dkexecutive.com`)
3. Configure DNS with your domain provider:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Update environment variables:
   - `NEXTAUTH_URL=https://dkexecutive.com`
   - `NEXT_PUBLIC_APP_URL=https://dkexecutive.com`

## Step 12: Monitoring & Logs

### View Deployment Logs:
```powershell
vercel logs
```

### View Build Logs:
Vercel Dashboard > Your Project > Deployments > Click deployment > View Build Logs

### Real-time Logs:
```powershell
vercel logs --follow
```

## Common Git Commands Reference

```powershell
# Check status
git status

# View commit history
git log --oneline

# Create and switch to branch
git checkout -b branch-name

# Switch branches
git checkout main

# Pull latest changes
git pull origin main

# View changes
git diff

# Undo uncommitted changes
git checkout -- filename

# Revert last commit (creates new commit)
git revert HEAD

# View remote URL
git remote -v

# Update remote URL
git remote set-url origin https://github.com/USERNAME/REPO.git
```

## Continuous Deployment Benefits

✅ **Automatic Deployments**: Push to main = instant production update
✅ **Preview Deployments**: Every PR gets a unique preview URL
✅ **Rollback**: One-click rollback to any previous deployment
✅ **Zero Downtime**: Atomic deployments with instant rollback
✅ **Build Caching**: Faster subsequent builds
✅ **Analytics**: Built-in Web Analytics and Speed Insights

## Security Best Practices

1. ✅ Never commit `.env` files
2. ✅ Use environment variables for all secrets
3. ✅ Enable branch protection on main
4. ✅ Require PR reviews before merging
5. ✅ Use signed commits (optional)
6. ✅ Enable 2FA on GitHub and Vercel
7. ✅ Regularly rotate API keys
8. ✅ Monitor deployment logs for errors

## Troubleshooting

### Build Fails on Vercel:
1. Check build logs for errors
2. Test build locally: `npm run build`
3. Verify environment variables are set
4. Check Node.js version compatibility

### Environment Variables Not Working:
1. Verify variables are added in Vercel dashboard
2. Redeploy after adding variables
3. Check variable names match exactly (case-sensitive)

### Mobile App Not Connecting:
1. Update `EXPO_PUBLIC_API_BASE` to production URL
2. Rebuild mobile apps with updated environment
3. Clear app cache and reinstall

## Next Steps

1. Push code to GitHub ✓
2. Connect to Vercel ✓
3. Add environment variables ✓
4. Deploy to production ✓
5. Build mobile APKs with production API URL
6. Test all features in production
7. Set up monitoring and alerts
