-- Migration: Add account status and email verification
-- This adds the new fields to support customer account approval workflow

-- Add AccountStatus enum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING_VERIFICATION', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- Add new columns to User table
ALTER TABLE "User" 
  ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT,
  ADD COLUMN IF NOT EXISTS "emailVerificationExpiry" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "accountStatus" "AccountStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);

-- Make phone unique
ALTER TABLE "User" ADD CONSTRAINT "User_phone_key" UNIQUE ("phone");

-- Create indexes
CREATE INDEX IF NOT EXISTS "User_accountStatus_idx" ON "User"("accountStatus");
CREATE INDEX IF NOT EXISTS "User_emailVerificationToken_idx" ON "User"("emailVerificationToken");

-- Update existing users to APPROVED status (so they can still login)
UPDATE "User" SET "accountStatus" = 'APPROVED' WHERE "accountStatus" IS NULL;

-- Note: If you get errors about existing NULL phone values preventing UNIQUE constraint,
-- run: UPDATE "User" SET "phone" = NULL WHERE "phone" = '';
-- Or temporarily remove duplicates before running this migration
