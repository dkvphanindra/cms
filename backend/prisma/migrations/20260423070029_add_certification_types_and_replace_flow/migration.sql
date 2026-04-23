-- AlterTable
ALTER TABLE "Certification" ADD COLUMN     "certificationTypeId" TEXT;

-- CreateTable
CREATE TABLE "CertificationType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificationType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CertificationType_name_key" ON "CertificationType"("name");

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_certificationTypeId_fkey" FOREIGN KEY ("certificationTypeId") REFERENCES "CertificationType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
