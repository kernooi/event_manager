-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY');

-- AlterTable
ALTER TABLE "Attendee" ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'PREFER_NOT_TO_SAY';
