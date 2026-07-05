-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "city" TEXT,
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "profession" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "streetNumber" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "city" TEXT,
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "profession" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "streetNumber" TEXT,
ADD COLUMN     "zipCode" TEXT;
