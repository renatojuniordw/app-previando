-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "portalConfig" JSONB NOT NULL DEFAULT '{"showProcessTracking":true,"showCalculations":true,"showRetroactives":false,"showInterpretation":false}';
