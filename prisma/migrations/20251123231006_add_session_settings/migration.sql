-- CreateTable
CREATE TABLE "SessionSettings" (
    "id" TEXT NOT NULL,
    "customerRememberMe" BOOLEAN NOT NULL DEFAULT true,
    "staffSessionTimeout" INTEGER NOT NULL DEFAULT 15,
    "autoLogoutEnabled" BOOLEAN NOT NULL DEFAULT true,
    "customerSessionMaxAge" INTEGER NOT NULL DEFAULT 2592000,
    "staffSessionMaxAge" INTEGER NOT NULL DEFAULT 28800,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "SessionSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionSettings_updatedBy_idx" ON "SessionSettings"("updatedBy");

-- AddForeignKey
ALTER TABLE "SessionSettings" ADD CONSTRAINT "SessionSettings_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
