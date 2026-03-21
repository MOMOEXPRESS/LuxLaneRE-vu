-- AlterTable: add status column to conversations
ALTER TABLE "conversations" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "room_events" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_files" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_schedule_items" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "location" TEXT,
    "notes" TEXT,

    CONSTRAINT "room_schedule_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "room_events_roomId_createdAt_idx" ON "room_events"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "room_files_roomId_idx" ON "room_files"("roomId");

-- CreateIndex
CREATE INDEX "room_schedule_items_roomId_idx" ON "room_schedule_items"("roomId");

-- AddForeignKey
ALTER TABLE "room_events" ADD CONSTRAINT "room_events_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_files" ADD CONSTRAINT "room_files_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_schedule_items" ADD CONSTRAINT "room_schedule_items_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
