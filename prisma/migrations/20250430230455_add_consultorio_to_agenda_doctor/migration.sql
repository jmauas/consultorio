/*
  Warnings:

  - You are about to drop the column `doctor` on the `Turno` table. All the data in the column will be lost.
  - You are about to drop the column `emoji` on the `Turno` table. All the data in the column will be lost.
  - Added the required column `consultorioId` to the `Turno` table without a default value. This is not possible if the table is not empty.
  - Added the required column `doctorId` to the `Turno` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AgendaDoctor" ADD COLUMN     "consultorioId" TEXT;

-- AlterTable
ALTER TABLE "ConfiguracionConsultorio" ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "TipoTurnoDoctor" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Turno" DROP COLUMN "doctor",
DROP COLUMN "emoji",
ADD COLUMN     "consultorioId" TEXT NOT NULL,
ADD COLUMN     "doctorId" TEXT NOT NULL,
ADD COLUMN     "observaciones" TEXT;

-- CreateTable
CREATE TABLE "Consultorio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consultorio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AgendaDoctor" ADD CONSTRAINT "AgendaDoctor_consultorioId_fkey" FOREIGN KEY ("consultorioId") REFERENCES "Consultorio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_consultorioId_fkey" FOREIGN KEY ("consultorioId") REFERENCES "Consultorio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
