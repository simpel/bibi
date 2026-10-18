import { ok, type Result } from "../../errors/result";
import { followAssignment } from "../../features/assignment/write-operations";
import { changeTicketPhase } from "../../features/ticket/change-phase-operation";
import { createTicket } from "../../features/ticket/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { addDays } from "../../recurrence/plain-date";
import { fromZonedParts, toZonedParts } from "../../recurrence/zoned-time";
import type { DemoRefs } from "./demo-refs";
import { missing, resolveFields } from "./seed-fields";
import { seedDemoLines } from "./seed-lines";
import type { DemoTicket } from "./ticket-types";
import type { DemoUserIds } from "./users";

const TIME_ZONE = "Europe/Stockholm";

export type SeedTicketsInput = {
  context: ExecuteContext;
  tickets: readonly DemoTicket[];
  refs: DemoRefs;
  userIds: DemoUserIds;
  /** The day of the run (D in `docs/demo-seed.md`); defaults to now. */
  now?: Date;
};

type AtInput = { now: Date; day: number; time: string };

/** D + `day` at the local time `HH:MM` in Stockholm. */
function at({ now, day, time }: AtInput): Date {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  const today = toZonedParts({ instant: now, timeZone: TIME_ZONE }).date;
  const date = addDays({ date: today, days: day });
  return fromZonedParts({ date, time: { hour, minute, second: 0 }, timeZone: TIME_ZONE });
}

type PeriodInput = { ticket: DemoTicket; now: Date };

/** The desired period on the ticket's day and, for leads with soft holds, `holdsUntil`. */
function periodOf({ ticket, now }: PeriodInput) {
  const holdsUntil =
    ticket.holdsUntilDay === undefined
      ? {}
      : { holdsUntil: at({ now, day: ticket.holdsUntilDay, time: "23:59" }) };
  return {
    desiredStartsAt: at({ now, day: ticket.day, time: ticket.from }),
    desiredEndsAt: at({ now, day: ticket.day, time: ticket.to }),
    ...holdsUntil,
  };
}

type PeopleInput = { userIds: DemoUserIds; ticket: DemoTicket };

/** The user ids of the ticket's assignee and followers, or the first unknown name. */
function resolvePeople({ userIds, ticket }: PeopleInput) {
  const names = [...(ticket.assignee ? [ticket.assignee] : []), ...(ticket.followers ?? [])];
  const unknown = names.find((name) => !userIds.has(name));
  if (unknown) return missing({ what: `user ${unknown}` });
  const id = ({ name }: { name: string }) => userIds.get(name) ?? "";
  const assigneeId = ticket.assignee ? id({ name: ticket.assignee }) : null;
  const followerIds = (ticket.followers ?? []).map((name) => id({ name }));
  return ok({ value: { assigneeId, followerIds } });
}

type TicketInput = Omit<SeedTicketsInput, "tickets" | "now"> & {
  ticket: DemoTicket;
  now: Date;
};

async function seedTicket({ context, refs, userIds, ticket, now }: TicketInput) {
  const type = refs.ticketTypes.get(ticket.type);
  if (!type) return missing({ what: `ticket type ${ticket.type}` });
  const customer = await context.db.customer.findFirst({ where: { name: ticket.customer } });
  if (!customer) return missing({ what: `customer ${ticket.customer}` });
  const people = resolvePeople({ userIds, ticket });
  if (!people.ok) return people;
  const fields = resolveFields({ fields: ticket.fields, type });
  if (!fields.ok) return fields;
  const input = {
    ...{ entityTypeId: type.id, customerId: customer.id, ...periodOf({ ticket, now }) },
    ...{ estimatedHeadcount: ticket.headcount, assigneeId: people.value.assigneeId },
    fields: fields.value,
  };
  const created = await execute({ operation: createTicket, input, context });
  if (!created.ok) return created;
  for (const userId of people.value.followerIds) {
    const subject = { subjectType: "TICKET" as const, subjectId: created.value.id };
    const followed = await execute({
      operation: followAssignment,
      input: { ...subject, userId },
      context,
    });
    if (!followed.ok) return followed;
  }
  const lines = await seedDemoLines({
    context,
    ticketId: created.value.id,
    lines: ticket.lines ?? [],
    at: ({ time }) => at({ now, day: ticket.day, time }),
  });
  if (!lines.ok) return lines;
  return movePhase({ context, ticket, ticketId: created.value.id });
}

type MoveInput = { context: ExecuteContext; ticket: DemoTicket; ticketId: string };

/** Moves the new ticket to its phase in the spec through `ticket.changePhase` (ADR 0043). */
async function movePhase({ context, ticket, ticketId }: MoveInput) {
  if (!ticket.phase) return ok({ value: true });
  const phase = await context.db.ticketPhase.findFirst({ where: { name: ticket.phase } });
  if (!phase) return missing({ what: `ticket phase ${ticket.phase}` });
  const input = { ticketId, phaseId: phase.id, reason: ticket.reason };
  return execute({ operation: changeTicketPhase, input, context });
}

/** Slice 5 of ADR 0025, started: tickets with a main assignee, followers and phase, as SYSTEM. */
export async function seedDemoTickets({
  tickets,
  now = new Date(),
  ...rest
}: SeedTicketsInput): Promise<Result<true>> {
  for (const ticket of tickets) {
    const result = await seedTicket({ ...rest, ticket, now });
    if (!result.ok) return result;
  }
  return ok({ value: true });
}
