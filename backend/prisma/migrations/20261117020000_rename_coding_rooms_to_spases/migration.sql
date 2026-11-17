
BEGIN;

ALTER TYPE "CodingRoomGuestMode" RENAME TO "CodingSpaseGuestMode";
ALTER TYPE "CodingRoomJobState" RENAME TO "CodingSpaseJobState";

ALTER TABLE "CodingRoom" RENAME TO "CodingSpase";
ALTER TABLE "CodingRoomMember" RENAME TO "CodingSpaseMember";
ALTER TABLE "CodingRoomDocument" RENAME TO "CodingSpaseDocument";
ALTER TABLE "CodingRoomJob" RENAME TO "CodingSpaseJob";

ALTER TABLE "CodingSpaseMember" RENAME COLUMN "roomId" TO "spaseId";
ALTER TABLE "CodingSpaseDocument" RENAME COLUMN "roomId" TO "spaseId";
ALTER TABLE "CodingSpaseJob" RENAME COLUMN "roomId" TO "spaseId";

ALTER TABLE "CodingSpase" RENAME CONSTRAINT "CodingRoom_pkey" TO "CodingSpase_pkey";
ALTER TABLE "CodingSpase" RENAME CONSTRAINT "CodingRoom_hostId_fkey" TO "CodingSpase_hostId_fkey";
ALTER TABLE "CodingSpase" RENAME CONSTRAINT "CodingRoom_problemId_fkey" TO "CodingSpase_problemId_fkey";
ALTER TABLE "CodingSpaseMember" RENAME CONSTRAINT "CodingRoomMember_pkey" TO "CodingSpaseMember_pkey";
ALTER TABLE "CodingSpaseMember" RENAME CONSTRAINT "CodingRoomMember_roomId_fkey" TO "CodingSpaseMember_spaseId_fkey";
ALTER TABLE "CodingSpaseMember" RENAME CONSTRAINT "CodingRoomMember_userId_fkey" TO "CodingSpaseMember_userId_fkey";
ALTER TABLE "CodingSpaseMember" RENAME CONSTRAINT "CodingRoomMember_colorIndex_check" TO "CodingSpaseMember_colorIndex_check";
ALTER TABLE "CodingSpaseDocument" RENAME CONSTRAINT "CodingRoomDocument_pkey" TO "CodingSpaseDocument_pkey";
ALTER TABLE "CodingSpaseDocument" RENAME CONSTRAINT "CodingRoomDocument_roomId_fkey" TO "CodingSpaseDocument_spaseId_fkey";
ALTER TABLE "CodingSpaseDocument" RENAME CONSTRAINT "CodingRoomDocument_problemId_fkey" TO "CodingSpaseDocument_problemId_fkey";
ALTER TABLE "CodingSpaseJob" RENAME CONSTRAINT "CodingRoomJob_pkey" TO "CodingSpaseJob_pkey";
ALTER TABLE "CodingSpaseJob" RENAME CONSTRAINT "CodingRoomJob_roomId_fkey" TO "CodingSpaseJob_spaseId_fkey";

ALTER INDEX "CodingRoom_code_key" RENAME TO "CodingSpase_code_key";
ALTER INDEX "CodingRoomJob_roomId_state_createdAt_idx" RENAME TO "CodingSpaseJob_spaseId_state_createdAt_idx";
ALTER INDEX "CodingRoomJob_roomId_userId_requestId_key" RENAME TO "CodingSpaseJob_spaseId_userId_requestId_key";

COMMIT;
