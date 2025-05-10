-- AlterTable
ALTER TABLE "GoogleAuth" ADD COLUMN     "access_token" TEXT,
ADD COLUMN     "expiry_date" TEXT,
ADD COLUMN     "scope" TEXT,
ADD COLUMN     "token_type" TEXT;
