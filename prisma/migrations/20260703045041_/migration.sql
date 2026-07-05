/*
  Warnings:

  - You are about to drop the column `assinaturaEnabled` on the `plan_limits` table. All the data in the column will be lost.
  - You are about to drop the `assinaturas` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "assinaturas" DROP CONSTRAINT "assinaturas_caseId_fkey";

-- AlterTable
ALTER TABLE "plan_limits" DROP COLUMN "assinaturaEnabled";

-- DropTable
DROP TABLE "assinaturas";
