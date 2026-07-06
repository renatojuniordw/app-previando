-- CreateEnum
CREATE TYPE "BpcTipo" AS ENUM ('IDOSO', 'DEFICIENCIA');

-- AlterTable
ALTER TABLE "bpc_analyses" ADD COLUMN     "tipoBpc" "BpcTipo" NOT NULL DEFAULT 'DEFICIENCIA',
ALTER COLUMN "patologia" DROP NOT NULL;
