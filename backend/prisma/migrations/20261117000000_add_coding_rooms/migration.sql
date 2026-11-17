-- CreateEnum
CREATE TYPE "CodingRoomGuestMode" AS ENUM ('EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "CodingRoomJobState" AS ENUM ('QUEUED', 'RUNNING', 'FINISHED', 'FAILED');

-- CreateTable
CREATE TABLE "CodingRoom" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(5),
    "hostId" TEXT NOT NULL,
    "guestMode" "CodingRoomGuestMode" NOT NULL,
    "problemId" TEXT,
    "language" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "CodingRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingRoomMember" (
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "reservedUntil" TIMESTAMP(3) NOT NULL,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "CodingRoomMember_pkey" PRIMARY KEY ("roomId","userId")
);

-- CreateTable
CREATE TABLE "CodingRoomDocument" (
    "roomId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "state" BYTEA NOT NULL,

    CONSTRAINT "CodingRoomDocument_pkey" PRIMARY KEY ("roomId","problemId","language")
);

-- CreateTable
CREATE TABLE "CodingRoomJob" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "state" "CodingRoomJobState" NOT NULL DEFAULT 'QUEUED',
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),

    CONSTRAINT "CodingRoomJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodingRoom_code_key" ON "CodingRoom"("code");

-- CreateIndex
CREATE INDEX "CodingRoomJob_roomId_state_createdAt_idx" ON "CodingRoomJob"("roomId", "state", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CodingRoomJob_roomId_userId_requestId_key" ON "CodingRoomJob"("roomId", "userId", "requestId");

-- AddForeignKey
ALTER TABLE "CodingRoom" ADD CONSTRAINT "CodingRoom_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingRoom" ADD CONSTRAINT "CodingRoom_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingRoomMember" ADD CONSTRAINT "CodingRoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CodingRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingRoomMember" ADD CONSTRAINT "CodingRoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingRoomDocument" ADD CONSTRAINT "CodingRoomDocument_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CodingRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingRoomDocument" ADD CONSTRAINT "CodingRoomDocument_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingRoomJob" ADD CONSTRAINT "CodingRoomJob_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CodingRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

