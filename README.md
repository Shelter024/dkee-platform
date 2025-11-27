# DK Executive Engineers Platform

An integrated web platform for DK Executive Engineers with three main components:

## Features

### 1. Public Website
- Company information and services showcase
- Automotive services (repairs, diagnostics, tracking, maintenance)
- Property management services (sales, leases, rentals, surveys)
- Contact forms and consultation requests
- Dynamic background media (images, videos, slideshows) for pages and blogs

### 2. Customer Portal
- Account management with role-based access control
- Service history tracking
- Emergency request system
- Direct communication with shop
- Invoice and payment history
- Vehicle and property management
- Installable as mobile/desktop app (PWA)

### 3. Admin Dashboard
- **Automotive Department**: Manage repairs, diagnostics, spare parts, vehicle tracking devices
- **Property Management**: Handle listings, leases, sales, surveys, consultations
- **Point of Sale (POS)**: Direct spare parts sales with cart, checkout, and receipts
- **Vehicle Tracking**: Real-time vehicle tracking and history
- **Database Management**: Direct link to Prisma Studio for advanced operations
- User management and role assignments
- Analytics and reporting with export capabilities
- Blog and page management with rich text editor
- Background media configuration for branding
- Real-time notifications and messaging
- Offline PWA capabilities

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with role-based access control
- **PWA**: next-pwa with offline support, push notifications, background sync
- **State Management**: React Query (@tanstack/react-query)
- **File Storage**: Cloudinary
- **Payments**: Paystack integration
- **SMS/OTP**: Twilio
- **Error Monitoring**: Sentry
- **Real-time**: Pusher for live notifications
- **Caching**: Redis for rate limiting and session management
- **Security**: Advanced headers (CSP, HSTS), input sanitization, rate limiting

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database and configuration details.

3. **Set up the database**:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**: Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── (public)/          # Public website pages
│   ├── (customer)/        # Customer portal
│   ├── (admin)/           # Admin dashboard
│   └── api/               # API routes
├── components/            # Reusable components
├── lib/                   # Utilities and configurations
└── types/                 # TypeScript types

prisma/
└── schema.prisma         # Database schema
```

## Default Accounts (After Seeding)

- **Admin**: admin@dkexecutive.com / password: Admin123!
- **Customer**: customer@example.com / password: Customer123!

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio (database management GUI)
- `npm run db:seed` - Seed database with initial data
- `npm run anonymize:staging` - Anonymize staging data for security

## Key Features

### Security
- ✅ Advanced security headers (CSP, HSTS, X-Frame-Options)
- ✅ Rate limiting on critical endpoints
- ✅ Input sanitization for all user inputs
- ✅ Role-based access control (RBAC)
- ✅ Session management with NextAuth
- ✅ Encrypted file uploads via Cloudinary

### Progressive Web App (PWA)
- ✅ Installable on mobile and desktop devices
- ✅ Offline support with service worker caching
- ✅ Push notifications for real-time alerts
- ✅ Background sync for offline operations
- ✅ App-like experience with native feel

### Performance
- ✅ Redis caching for frequently accessed data
- ✅ Optimized database queries with Prisma
- ✅ Image optimization via Cloudinary CDN
- ✅ Code splitting and lazy loading
- ✅ Server-side rendering (SSR) and static generation

### Analytics & Reporting
- ✅ Comprehensive analytics dashboard
- ✅ Export data in multiple formats (CSV, JSON, Excel, PDF)
- ✅ Real-time metrics and insights
- ✅ Custom date range filtering
- ✅ Department-specific analytics

## Documentation

- [Getting Started](./GETTING_STARTED.md) - Quick start guide
- [Features](./FEATURES.md) - Detailed feature list
- [Deployment](./DEPLOYMENT.md) - Production deployment guide
- [Security](./SECURITY.md) - Security features and best practices
- [Project Structure](./PROJECT_STRUCTURE.md) - Codebase organization
- [PDF Templates](./PDF_TEMPLATES.md) - PDF generation documentation
- [Cron Job Setup](./CRON_SETUP.md) - Automated notification configuration
- [Cron Test Guide](./CRON_TEST_GUIDE.md) - Quick testing guide

## Support

For questions or support, contact:
- **Email**: support@dkexecutive.com
- **Phone**: +233-200-000-0000

## License

Proprietary - DK Executive Engineers © 2025
