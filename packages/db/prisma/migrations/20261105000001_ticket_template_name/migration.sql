-- A predefined ticket's name is unique among the organization's active ones (ADR 0043). Not
-- expressible in the Prisma schema; a violation surfaces as CONFLICT.
CREATE UNIQUE INDEX "TicketTemplate_active_name_key" ON "TicketTemplate"("organizationId", "name") WHERE "status" = 'ACTIVE';
