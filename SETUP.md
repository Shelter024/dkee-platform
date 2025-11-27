# Setup and Installation Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- npm or yarn package manager

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment Variables

Copy the `.env.example` file to `.env`:

```bash
copy .env.example .env
```

Edit `.env` and configure:

1. **Database URL**: Update with your PostgreSQL connection string
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/dk_executive_engineers?schema=public"
   ```

2. **NextAuth Secret**: Generate a secure secret
   ```bash
   # Run this in PowerShell to generate a secret:
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
   ```
   Add the generated value to `NEXTAUTH_SECRET`

3. **Email Configuration** (Optional): Configure SMTP settings for email notifications

## Step 3: Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with initial data
npm run db:seed
```

## Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Login Credentials

After seeding the database, you can log in with these accounts:

- **Admin**: 
  - Email: admin@dkexecutive.com
  - Password: Admin123!

- **Automotive Staff**:
  - Email: auto@dkexecutive.com
  - Password: AutoStaff123!

- **Property Staff**:
  - Email: property@dkexecutive.com
  - Password: PropertyStaff123!

- **Customer**:
  - Email: customer@example.com
  - Password: Customer123!

## PWA Setup

The app is configured as a Progressive Web App (PWA). To complete the setup:

1. Generate app icons using a tool like https://realfavicongenerator.net/
2. Place icons in `public/icons/` directory
3. The PWA will automatically register when you build for production

To test PWA in development:
1. Build the app: `npm run build`
2. Start production server: `npm start`
3. Open in browser and look for "Install App" prompt

## Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Database Management

```bash
# Open Prisma Studio (Database GUI)
npm run db:studio

# Reset database (WARNING: Deletes all data)
npx prisma db push --force-reset
npm run db:seed
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify DATABASE_URL in `.env` is correct
- Check database credentials and permissions

### Build Errors
- Clear Next.js cache: `Remove-Item -Recurse -Force .next`
- Reinstall dependencies: `Remove-Item -Recurse -Force node_modules; npm install`

### PWA Not Working
- PWA only works in production mode or over HTTPS
- Clear browser cache and service workers
- Check browser console for errors

## Next Steps

1. **Customize Branding**: Replace logo and colors in `tailwind.config.ts`
2. **Add Email Service**: Configure SMTP settings in `.env`
3. **Deploy**: Deploy to Vercel, Netlify, or your preferred hosting
4. **SSL Certificate**: Ensure HTTPS is configured for production
5. **Generate Icons**: Create and add proper app icons

For more information, see the [README.md](README.md) file.
