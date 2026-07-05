-- AlterTable: add firstLoginAt to users
ALTER TABLE "users" ADD COLUMN "firstLoginAt" TIMESTAMP(3);

-- CreateTable: client_access
CREATE TABLE "client_access" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_access_caseId_key" ON "client_access"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "client_access_token_key" ON "client_access"("token");

-- CreateIndex
CREATE INDEX "client_access_token_idx" ON "client_access"("token");

-- AddForeignKey
ALTER TABLE "client_access" ADD CONSTRAINT "client_access_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_access" ADD CONSTRAINT "client_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
