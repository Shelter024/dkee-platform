-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN     "backgroundEffect" TEXT,
ADD COLUMN     "backgroundMedia" TEXT,
ADD COLUMN     "backgroundOpacity" DOUBLE PRECISION,
ADD COLUMN     "backgroundOverlay" TEXT,
ADD COLUMN     "backgroundType" TEXT;

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "backgroundEffect" TEXT,
ADD COLUMN     "backgroundMedia" TEXT,
ADD COLUMN     "backgroundOpacity" DOUBLE PRECISION,
ADD COLUMN     "backgroundOverlay" TEXT,
ADD COLUMN     "backgroundType" TEXT;
