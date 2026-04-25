-- CreateEnum
CREATE TYPE "UpdateType" AS ENUM ('INTERNSHIP', 'WORKSHOP', 'TRAINING', 'OTHER');

-- AlterTable
ALTER TABLE "Certification" ADD COLUMN     "requirement" TEXT;

-- AlterTable
ALTER TABLE "StudentDocument" ADD COLUMN     "requirement" TEXT;

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "UpdateType" NOT NULL DEFAULT 'OTHER',
    "link" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Announcement_type_idx" ON "Announcement"("type");

-- CreateIndex
CREATE INDEX "Certification_requirement_idx" ON "Certification"("requirement");

-- CreateIndex
CREATE INDEX "StudentDocument_requirement_idx" ON "StudentDocument"("requirement");
