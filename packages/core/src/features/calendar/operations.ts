import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { loadBlocks } from "./load-blocks";
import { resolveRange } from "./resolve-range";
import { CalendarRangeInputSchema, CalendarRangeSchema } from "./schema";

export const calendarRange = defineOperation({
  name: "calendar.range",
  kind: "query",
  description:
    "What is on the calendar between two days (both inclusive, at most 62): every occupancy of " +
    "a bookable item (holds, setup and teardown time, maintenance, internal use) joined with its " +
    "line, ticket, item state and ticket status. The days are in the venue's time zone when " +
    "venueId is given, else the organization's. Blocks name their item by id (item.get or " +
    "item.list resolve it); the line's name and held-since are null without program:read, the " +
    "state's name and colour without pipeline:read. A view read model (ADR 0071): each line " +
    "block carries details (customer and client contact with customer:read; quantity, value " +
    "excl. VAT, note, the line's assignee and allocated staff with program:read; headcount and " +
    "the ticket's assignee always), so one call answers what the calendar shows.",
  input: CalendarRangeInputSchema,
  output: CalendarRangeSchema,
  permission: "ticket:read",
  // A view read model (ADR 0071): other features' fields are gated by their read in load-details.
  entityType: "occupancy",
  handler: async ({ input, context }) => {
    const range = await resolveRange({ context, input });
    if (!range.ok) return range;
    if (input.ticketId) {
      const ticket = await context.db.ticket.findFirst({
        where: { id: input.ticketId },
        select: { id: true },
      });
      if (!ticket) return notFound({ entity: "Ticket" });
    }
    const { from, to } = range.value;
    const blocks = await loadBlocks({ context, filters: input, from, to });
    return ok({ value: { ...range.value, blocks } });
  },
});

export const calendarOperations = [calendarRange];
