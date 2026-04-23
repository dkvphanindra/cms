-- AlterTable
ALTER TABLE "Certification" ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "btechCgpa" DOUBLE PRECISION,
ADD COLUMN     "btechPercentage" DOUBLE PRECISION,
ADD COLUMN     "interMarks" DOUBLE PRECISION,
ADD COLUMN     "tenthMarks" DOUBLE PRECISION;
