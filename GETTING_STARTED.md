# Getting Started with DK Executive Engineers Platform

Welcome! This guide will help you get the application up and running quickly.

## Quick Setup (Recommended)

### Option 1: Automated Setup Script

Run the PowerShell setup script:

```powershell
.\setup.ps1
```

This script will:
- ✅ Check Node.js installation
- ✅ Install all dependencies
- ✅ Create .env file from template
- ✅ Generate Prisma client
- ✅ Set up the database
- ✅ Seed with demo data

### Option 2: Manual Setup

If you prefer manual setup, follow these steps:

1. **Install dependencies**
   ```powershell
   npm install
   ```

2. **Configure environment**
   ```powershell
   copy .env.example .env
   ```
   Then edit `.env` and set your database URL and secrets.

3. **Setup database**
   ```powershell
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

4. **Start development server**
   ```powershell
   npm run dev
   ```

## What You Need Before Starting

### Required Software
- ✅ **Node.js 18+** - [Download](https://nodejs.org/)
- ✅ **PostgreSQL** - [Download](https://www.postgresql.org/download/)
- ✅ **Code Editor** - VS Code recommended

### Database Setup

1. **Install PostgreSQL** if not already installed
2. **Create a database**:
   ```sql
   CREATE DATABASE dk_executive_engineers;
   ```
3. **Note your connection details**:
   - Host: usually `localhost`
   - Port: usually `5432`
   - Username: your postgres user
   - Password: your postgres password

## Configuration

### Database URL Format

Update the `DATABASE_URL` in `.env`:

```
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/dk_executive_engineers?schema=public"
```

Replace:
- `USERNAME` with your PostgreSQL username
- `PASSWORD` with your PostgreSQL password

### Generate NextAuth Secret

Run in PowerShell:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Copy the output and paste it as `NEXTAUTH_SECRET` in `.env`

## Testing the Application

### 1. Start the Server

```powershell
npm run dev
```

### 2. Open in Browser

Navigate to: http://localhost:3000

### 3. Test Login

Use these demo accounts:

**Admin Account:**
- Email: `admin@dkexecutive.com`
- Password: `Admin123!`
- Access: Full system control

**Customer Account:**
- Email: `customer@example.com`
- Password: `Customer123!`
- Access: Customer portal

**Automotive Staff:**
- Email: `auto@dkexecutive.com`
- Password: `AutoStaff123!`

**Property Staff:**
- Email: `property@dkexecutive.com`
- Password: `PropertyStaff123!`

## Exploring the Platform

### Public Website
- **Homepage**: Overview of services
- **Automotive**: `/automotive` - Automotive services info
- **Property**: `/property` - Property management info
- **Contact**: `/contact` - Contact form

### Customer Portal (Login as Customer)
- **Dashboard**: `/dashboard/customer` - Overview
- **Services**: Track automotive services
- **Properties**: Browse available properties
- **Emergency**: Request urgent assistance
- **Messages**: Communicate with staff
- **Invoices**: View billing information

### Admin Dashboard (Login as Admin)
- **Dashboard**: `/dashboard/admin` - System overview
- **Automotive**: Manage automotive services
- **Property**: Manage property listings
- **Customers**: Customer management
- **Parts**: Spare parts inventory
- **Emergency**: Handle emergency requests
- **Analytics**: View reports and insights

## PWA (Progressive Web App) Features

### Testing PWA in Development

1. **Build for production**:
   ```powershell
   npm run build
   ```

2. **Start production server**:
   ```powershell
   npm start
   ```

3. **Open in browser** and look for "Install App" button

### PWA Benefits
- ✅ Works offline when logged in
- ✅ Installable on mobile and desktop
- ✅ Fast loading with caching
- ✅ Native app-like experience

## Common Tasks

### View Database

Open Prisma Studio to browse data:
```powershell
npm run db:studio
```

### Reset Database

If you need to start fresh:
```powershell
npx prisma db push --force-reset
npm run db:seed
```

### Build for Production

```powershell
npm run build
npm start
```

## Troubleshooting

### "Cannot connect to database"
- ✅ Ensure PostgreSQL is running
- ✅ Check DATABASE_URL in `.env`
- ✅ Verify database exists
- ✅ Test credentials with psql or pgAdmin

### "Module not found" errors
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### "Prisma Client not initialized"
```powershell
npm run db:generate
```

### PWA not installing
- ✅ Build for production first
- ✅ Serve over HTTPS or localhost
- ✅ Check browser console for errors
- ✅ Clear browser cache and service workers

## Next Steps

### Customization

1. **Branding**: Update colors in `tailwind.config.ts`
2. **Logo**: Replace logo in navbar and PWA icons
3. **Content**: Update company information in Footer
4. **Email**: Configure SMTP settings for notifications

### Development

1. **Add Features**: Extend the dashboard with new functionality
2. **API Routes**: Create new endpoints in `src/app/api/`
3. **Components**: Build reusable components in `src/components/`
4. **Database**: Modify `prisma/schema.prisma` and run migrations

### Deployment

Ready to deploy? Consider:
- **Vercel**: Easiest for Next.js (vercel.com)
- **Railway**: Good for full-stack apps (railway.app)
- **DigitalOcean**: Traditional hosting
- **AWS/Azure**: Enterprise solutions

## Getting Help

### Documentation
- 📖 [Next.js Docs](https://nextjs.org/docs)
- 📖 [Prisma Docs](https://www.prisma.io/docs)
- 📖 [NextAuth Docs](https://next-auth.js.org)
- 📖 [Tailwind Docs](https://tailwindcss.com/docs)

### Project Files
- 📄 `README.md` - Project overview
- 📄 `SETUP.md` - Detailed setup guide
- 📄 `PROJECT_STRUCTURE.md` - Code organization

## Success Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and running
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Database created and seeded
- [ ] Development server running (`npm run dev`)
- [ ] Able to login with demo accounts
- [ ] Explored customer portal
- [ ] Explored admin dashboard

---

🎉 **Congratulations!** You're ready to start developing with DK Executive Engineers platform!
