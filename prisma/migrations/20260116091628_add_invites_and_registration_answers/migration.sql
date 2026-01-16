-- AlterTable
ALTER TABLE "Attendee" ALTER COLUMN "age" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "email" TEXT;

-- CreateTable
CREATE TABLE "RegistrationAnswer" (
    "id" UUID NOT NULL,
    "attendeeId" UUID NOT NULL,
    "fieldId" UUID NOT NULL,
    "value" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationAnswer_attendeeId_fieldId_key" ON "RegistrationAnswer"("attendeeId", "fieldId");

-- AddForeignKey
ALTER TABLE "RegistrationAnswer" ADD CONSTRAINT "RegistrationAnswer_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "Attendee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationAnswer" ADD CONSTRAINT "RegistrationAnswer_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "RegistrationField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
