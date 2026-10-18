-- Constraints Prisma cannot express (ADR 0043).

-- One active count per list value and place on a ticket. The index on "bookingId" went with that
-- column; it is recreated on "ticketId".
CREATE UNIQUE INDEX "Requirement_active_level_value_key" ON "Requirement"("ticketId", COALESCE("programItemId", ''), "vocabularyValueId") WHERE "status" = 'ACTIVE';

-- Exactly one active entry phase per organization: concurrent changes that would make a second
-- one fail with a unique violation (CONFLICT) instead of racing.
CREATE UNIQUE INDEX "TicketPhase_one_entry_key" ON "TicketPhase"("organizationId") WHERE "entry" AND "status" = 'ACTIVE';

-- The desired period ends after it starts when both ends are given.
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_desired_period_check" CHECK ("desiredStartsAt" IS NULL OR "desiredEndsAt" IS NULL OR "desiredEndsAt" > "desiredStartsAt");
