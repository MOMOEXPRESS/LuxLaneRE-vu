-- CreateTable
CREATE TABLE "availability_dates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "availability_dates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "availability_dates_userId_idx" ON "availability_dates"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "availability_dates_userId_date_key" ON "availability_dates"("userId", "date");

-- AddForeignKey
ALTER TABLE "availability_dates" ADD CONSTRAINT "availability_dates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
