/*
  Warnings:

  - You are about to drop the column `base` on the `ConfiguracionConsultorio` table. All the data in the column will be lost.
  - You are about to drop the column `calendario` on the `ConfiguracionConsultorio` table. All the data in the column will be lost.
  - You are about to drop the column `cuentas` on the `ConfiguracionConsultorio` table. All the data in the column will be lost.
  - You are about to drop the column `ia` on the `ConfiguracionConsultorio` table. All the data in the column will be lost.
  - You are about to drop the column `iaModel` on the `ConfiguracionConsultorio` table. All the data in the column will be lost.
  - You are about to drop the column `modo` on the `ConfiguracionConsultorio` table. All the data in the column will be lost.
  - You are about to drop the column `perfil` on the `ConfiguracionConsultorio` table. All the data in the column will be lost.
  - You are about to drop the column `puerto` on the `ConfiguracionConsultorio` table. All the data in the column will be lost.
  - You are about to drop the column `redireccion` on the `ConfiguracionConsultorio` table. All the data in the column will be lost.
  - You are about to drop the column `resto` on the `ConfiguracionConsultorio` table. All the data in the column will be lost.
  - You are about to drop the column `sinPubli` on the `ConfiguracionConsultorio` table. All the data in the column will be lost.
  - You are about to drop the column `storeTN` on the `ConfiguracionConsultorio` table. All the data in the column will be lost.
  - You are about to drop the column `sucursal` on the `ConfiguracionConsultorio` table. All the data in the column will be lost.
  - You are about to drop the column `telHumano` on the `ConfiguracionConsultorio` table. All the data in the column will be lost.
  - You are about to drop the column `tokenTN` on the `ConfiguracionConsultorio` table. All the data in the column will be lost.
  - You are about to drop the column `ventasTN` on the `ConfiguracionConsultorio` table. All the data in the column will be lost.
  - You are about to drop the `CalendarCache` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GoogleAuth` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Servicio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Validacion` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "ConfiguracionConsultorio" DROP COLUMN "base",
DROP COLUMN "calendario",
DROP COLUMN "cuentas",
DROP COLUMN "ia",
DROP COLUMN "iaModel",
DROP COLUMN "modo",
DROP COLUMN "perfil",
DROP COLUMN "puerto",
DROP COLUMN "redireccion",
DROP COLUMN "resto",
DROP COLUMN "sinPubli",
DROP COLUMN "storeTN",
DROP COLUMN "sucursal",
DROP COLUMN "telHumano",
DROP COLUMN "tokenTN",
DROP COLUMN "ventasTN";

-- DropTable
DROP TABLE "CalendarCache";

-- DropTable
DROP TABLE "GoogleAuth";

-- DropTable
DROP TABLE "Servicio";

-- DropTable
DROP TABLE "Validacion";

-- CreateTable
CREATE TABLE "CuentasWhatsapp" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CuentasWhatsapp_pkey" PRIMARY KEY ("id")
);
