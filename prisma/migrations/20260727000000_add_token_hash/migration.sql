ALTER TABLE "client_access" ADD COLUMN "tokenHash" TEXT;
CREATE UNIQUE INDEX "client_access_tokenHash_key" ON "client_access"("tokenHash");
