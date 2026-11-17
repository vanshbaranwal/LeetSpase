ALTER TABLE "CodingRoomMember"
ADD COLUMN "colorIndex" INTEGER CHECK ("colorIndex" BETWEEN 0 AND 4);
