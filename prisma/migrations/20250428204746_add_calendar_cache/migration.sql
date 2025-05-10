-- CreateTable
CREATE TABLE "CalendarCache" (
    "id" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarCache_pkey" PRIMARY KEY ("id")
);
