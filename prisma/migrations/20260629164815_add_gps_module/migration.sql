-- AlterTable
ALTER TABLE "plan_limits" ADD COLUMN     "gpsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "gps_guides" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "plano" TEXT NOT NULL,
    "salarioContribuicao" DECIMAL(10,2) NOT NULL,
    "valorCalculado" DECIMAL(10,2) NOT NULL,
    "aliquota" DOUBLE PRECISION NOT NULL,
    "codigoPagamento" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gps_guides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gps_guides_caseId_idx" ON "gps_guides"("caseId");

-- AddForeignKey
ALTER TABLE "gps_guides" ADD CONSTRAINT "gps_guides_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
