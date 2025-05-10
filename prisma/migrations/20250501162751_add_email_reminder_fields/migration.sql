-- AlterTable
ALTER TABLE "ConfiguracionConsultorio" ADD COLUMN     "diasEnvioMail" TEXT,
ADD COLUMN     "envioMail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "horaEnvioMail" TEXT;
