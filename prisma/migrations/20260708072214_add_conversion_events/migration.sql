-- CreateEnum
CREATE TYPE "ConversionEventType" AS ENUM ('TEASER_VIEW', 'TEASER_CTA_CLICK', 'PAYWALL_MODAL_VIEW', 'PAYWALL_MODAL_CTA_CLICK');

-- CreateTable
CREATE TABLE "conversion_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "event" "ConversionEventType" NOT NULL,
    "feature" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversion_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversion_events_event_feature_idx" ON "conversion_events"("event", "feature");

-- CreateIndex
CREATE INDEX "conversion_events_userId_createdAt_idx" ON "conversion_events"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "conversion_events" ADD CONSTRAINT "conversion_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
