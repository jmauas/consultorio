/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `Turno` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Turno" ADD COLUMN     "token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Turno_token_key" ON "Turno"("token");
