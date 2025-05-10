-- AlterTable
ALTER TABLE "Paciente" ADD COLUMN     "coberturaMedicaId" TEXT;

-- AlterTable
ALTER TABLE "Turno" ADD COLUMN     "coberturaMedicaId" TEXT;

-- AddForeignKey
ALTER TABLE "Paciente" ADD CONSTRAINT "Paciente_coberturaMedicaId_fkey" FOREIGN KEY ("coberturaMedicaId") REFERENCES "CoberturaMedica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_coberturaMedicaId_fkey" FOREIGN KEY ("coberturaMedicaId") REFERENCES "CoberturaMedica"("id") ON DELETE SET NULL ON UPDATE CASCADE;
