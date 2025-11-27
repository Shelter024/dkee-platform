-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "category" TEXT,
ADD COLUMN     "template" TEXT NOT NULL DEFAULT 'default';

-- CreateIndex
CREATE INDEX "Page_category_idx" ON "Page"("category");
