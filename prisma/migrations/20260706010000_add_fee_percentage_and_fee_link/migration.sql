-- AlterTable
ALTER TABLE "fees" ADD COLUMN     "retroactiveId" TEXT;

-- AlterTable
ALTER TABLE "retroactives" ADD COLUMN     "clientNetValue" DECIMAL(12,2),
ADD COLUMN     "feePercentage" DECIMAL(5,2),
ADD COLUMN     "feeValue" DECIMAL(12,2);

-- CreateIndex
CREATE UNIQUE INDEX "fees_retroactiveId_key" ON "fees"("retroactiveId");

-- AddForeignKey
ALTER TABLE "fees" ADD CONSTRAINT "fees_retroactiveId_fkey" FOREIGN KEY ("retroactiveId") REFERENCES "retroactives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

