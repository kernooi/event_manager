-- CreateIndex
CREATE INDEX "Attendee_eventId_registeredAt_idx" ON "Attendee"("eventId", "registeredAt");

-- CreateIndex
CREATE INDEX "Attendee_eventId_checkedInAt_idx" ON "Attendee"("eventId", "checkedInAt");

-- CreateIndex
CREATE INDEX "CheckIn_eventId_idx" ON "CheckIn"("eventId");

-- CreateIndex
CREATE INDEX "Event_ownerId_idx" ON "Event"("ownerId");

-- CreateIndex
CREATE INDEX "Invite_eventId_idx" ON "Invite"("eventId");

-- CreateIndex
CREATE INDEX "Invite_eventId_usedAt_idx" ON "Invite"("eventId", "usedAt");

-- CreateIndex
CREATE INDEX "RegistrationField_eventId_idx" ON "RegistrationField"("eventId");
