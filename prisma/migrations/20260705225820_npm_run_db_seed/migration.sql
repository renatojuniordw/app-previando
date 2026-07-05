/*
  Warnings:

  - You are about to drop the column `trackjudMonitorId` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the column `trackjudRegisteredAt` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the column `whatsappEnabled` on the `plan_limits` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "cases_trackjudMonitorId_idx";

-- AlterTable
ALTER TABLE "cases" DROP COLUMN "trackjudMonitorId",
DROP COLUMN "trackjudRegisteredAt",
ALTER COLUMN "portalConfig" SET DEFAULT '{"showCalculations":true,"showRetroactives":false,"showInterpretation":false}';

-- AlterTable
ALTER TABLE "plan_limits" DROP COLUMN "whatsappEnabled";

-- CreateIndex
CREATE INDEX "calculations_caseId_isSelected_idx" ON "calculations"("caseId", "isSelected");
