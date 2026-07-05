-- AlterTable
ALTER TABLE "plan_limits" ADD COLUMN     "maxProcessInterpretPerMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "processInterpretEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "usage_records" ADD COLUMN     "processInterpretThisMonth" INTEGER NOT NULL DEFAULT 0;
