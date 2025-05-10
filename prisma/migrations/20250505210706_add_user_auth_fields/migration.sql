-- AlterTable
ALTER TABLE "User" ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "token" TEXT,
ADD COLUMN     "tokenExpires" TIMESTAMP(3);
