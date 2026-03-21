-- CreateTable
CREATE TABLE "client_profiles" (
    "userId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
