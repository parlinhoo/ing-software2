-- AlterTable
ALTER TABLE "incidente" ADD COLUMN     "anulado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "motivo_anulacion" TEXT;
