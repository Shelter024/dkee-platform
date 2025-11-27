-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT 'DK Executive Engineers',
    "companyEmail" TEXT NOT NULL DEFAULT 'info@dkexecutive.com',
    "companyPhone" TEXT NOT NULL DEFAULT '+233-200-000-0000',
    "companyAddress" TEXT NOT NULL DEFAULT 'Pawpaw Street, East Legon, Accra',
    "companyLogoUrl" TEXT,
    "siteUrl" TEXT NOT NULL DEFAULT 'http://localhost:3000',
    "siteName" TEXT NOT NULL DEFAULT 'DK Executive Engineers',
    "siteDescription" TEXT NOT NULL DEFAULT 'Automotive and Property Management Solutions',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "allowRegistrations" BOOLEAN NOT NULL DEFAULT true,
    "emailProvider" TEXT,
    "emailApiKey" TEXT,
    "emailFromAddress" TEXT NOT NULL DEFAULT 'noreply@dkexecutive.com',
    "emailFromName" TEXT NOT NULL DEFAULT 'DK Executive Engineers',
    "smsProvider" TEXT,
    "smsApiKey" TEXT,
    "smsApiSecret" TEXT,
    "smsFromNumber" TEXT,
    "paystackPublicKey" TEXT,
    "paystackSecretKey" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "facebookUrl" TEXT,
    "twitterUrl" TEXT,
    "instagramUrl" TEXT,
    "linkedinUrl" TEXT,
    "enableBlog" BOOLEAN NOT NULL DEFAULT true,
    "enableNotifications" BOOLEAN NOT NULL DEFAULT true,
    "enableAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemSettings_updatedBy_idx" ON "SystemSettings"("updatedBy");

-- AddForeignKey
ALTER TABLE "SystemSettings" ADD CONSTRAINT "SystemSettings_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
