# Project Structure

```
DKee/
├── prisma/
│   ├── schema.prisma          # Database schema with all models
│   └── seed.ts                # Database seeding script
│
├── public/
│   ├── icons/                 # PWA app icons
│   │   └── README.md          # Instructions for generating icons
│   ├── manifest.json          # PWA manifest configuration
│   └── offline.html           # Offline fallback page
│
├── src/
│   ├── app/                   # Next.js 14 App Router
│   │   ├── (public)/         # Public website routes
│   │   │   ├── page.tsx      # Homepage
│   │   │   ├── automotive/   # Automotive services page
│   │   │   ├── property/     # Property management page
│   │   │   ├── contact/      # Contact page
│   │   │   └── login/        # Login page
│   │   │
│   │   ├── api/              # API routes
│   │   │   └── auth/         # NextAuth API routes
│   │   │       └── [...nextauth]/
│   │   │
│   │   ├── dashboard/        # Protected dashboard routes
│   │   │   ├── page.tsx      # Dashboard router
│   │   │   ├── customer/     # Customer portal
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx              # Customer overview
│   │   │   │   ├── services/             # Service history
│   │   │   │   ├── properties/           # Property browsing
│   │   │   │   ├── emergency/            # Emergency requests
│   │   │   │   ├── messages/             # Communication
│   │   │   │   └── invoices/             # Billing
│   │   │   │
│   │   │   └── admin/        # Admin dashboard
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx              # Admin overview
│   │   │       ├── automotive/           # Automotive management
│   │   │       ├── property/             # Property management
│   │   │       ├── customers/            # Customer management
│   │   │       ├── parts/                # Spare parts inventory
│   │   │       ├── emergency/            # Emergency handling
│   │   │       ├── analytics/            # Reports & analytics
│   │   │       ├── settings/             # System settings
│   │   │       ├── branches/             # Branch offices (Ghana + future)
│   │   │       ├── blog/                 # Blog post management
│   │   │       ├── pages/                # Static page editor
│   │   │       ├── tips/                 # Tips & advice
│   │   │       ├── updates/              # Platform updates/news
│   │   │       └── integrations/         # External integrations (AI, hosting)
│   │   │
│   │   ├── layout.tsx        # Root layout with navbar/footer
│   │   └── globals.css       # Global styles
│   │
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Badge.tsx
│   │   │
│   │   ├── layout/           # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   │
│   │   └── providers/        # Context providers
│   │       └── AuthProvider.tsx
│   │
│   ├── lib/                  # Utility libraries
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── roles.ts          # Role guard utilities
│   │   └── utils.ts          # Utility functions (GHS currency, dates)
│   │
│   └── types/                # TypeScript type definitions
│       └── next-auth.d.ts    # NextAuth type extensions
│
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore rules
├── next.config.js           # Next.js configuration with PWA
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Project dependencies and scripts
├── README.md                # Project documentation
├── SETUP.md                 # Detailed setup instructions
└── setup.ps1                # PowerShell setup script
```

## Key Features by Directory

### `/prisma`
- Complete database schema for all entities
- Expanded models: Branch, BranchStaff, BlogPost, Page, Tip, Update, Integration
- Seed script with demo data + Ghana headquarters (Pawpaw Street, East Legon, Accra)
- Support for automotive and property management plus content management

### `/src/app`
**Public Routes** (No authentication required):
- Homepage with services overview
- Automotive services information
- Property listings showcase
- Contact form
- Login page

**Customer Portal** (Customer role):
- Dashboard with service overview
- Vehicle service history
- Property browsing and inquiries
- Emergency request system
- Message center
- Invoice management

**Admin Dashboard** (Admin/Staff/Office roles):
- Overview with key metrics
- Automotive service management
- Property management
- Customer management
- Spare parts inventory
- Emergency request handling
- Branch management (multi-location support)
- Blog, Pages, Tips, Updates (content management)
- Integrations (AI, hosting, cloud config)
- Analytics and reporting
- System settings

### `/src/components`
- **UI Components**: Reusable styled components (Button, Card, Input, Badge)
- **Layout**: Navbar with authentication state, Footer with company info
- **Providers**: Auth provider for session management

### `/src/lib`
- Prisma database client
- Authentication configuration
- Role checking utilities for elevated access (CEO, MANAGER, HR)
- Utility functions (formatting with GHS currency, validation)

### PWA Features
- Offline support with service workers
- App manifest for installability
- Caching strategies for assets
- Offline fallback page
- Mobile-optimized interface

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **PWA**: next-pwa
- **Icons**: Lucide React
- **State**: React Query
- **Forms**: React Hook Form

## User Roles

1. **ADMIN**: Full system access
2. **CEO**: Executive oversight across all departments and branches
3. **MANAGER**: Operational management & analytics
4. **HR**: Staff administration & onboarding
5. **STAFF_AUTO**: Automotive department management
6. **STAFF_PROPERTY**: Property management department
7. **CUSTOMER**: Customer portal access
