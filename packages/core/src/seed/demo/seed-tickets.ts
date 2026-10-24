import { ok, type Result } from "../../errors/result";
import { followAssignment } from "../../features/assignment/write-operations";
import { createTicket } from "../../features/ticket/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { addDays } from "../../time/plain-date";
import { fromZonedParts, toZonedParts } from "../../time/zoned-time";
import type { DemoRefs } from "./demo-refs";
import type { DemoTimeZones } from "./demo-time-zones";
import { missing, resolveDemoFields } from "./seed-fields";
import { seedDemoLines } from "./seed-lines";
import { seedTicketMoney } from "./seed-money";
import { seedTicketChoices } from "./seed-ticket-choices";
import { createDemoTicketFromTemplate } from "./seed-ticket-from-template";
import { moveStatus } from "./seed-ticket-status";
import type { DemoTicket } from "./ticket-types";
import type { DemoUserIds } from "./users";

export type SeedTicketsInput = {
  context: ExecuteContext;
  tickets: readonly DemoTicket[];
  refs: DemoRefs;
  userIds: DemoUserIds;
  /** The zones the local times are read in (ADR 0064). */
  zones: DemoTimeZones;
  /** The day of the run (D in `docs/demo-seed.md`); defaults to now. */
  now?: Date;
};

type AtInput = { now: Date; day: number; time: string; timeZone: string };

/** D + `day` at the local time `HH:MM` in `timeZone`. */
function at({ now, day, time, timeZone }: AtInput): Date {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  const today = toZonedParts({ instant: now, timeZone }).date;
  const date = addDays({ date: today, days: day });
  return fromZonedParts({ date, time: { hour, minute, second: 0 }, timeZone });
}

type PeriodInput = { ticket: DemoTicket; now: Date; timeZone: string };

/** The desired period on the ticket's day and, for leads with soft holds, `holdsUntil`. */
function periodOf({ ticket, now, timeZone }: PeriodInput) {
  const holdsUntil =
    ticket.holdsUntilDay === undefined
      ? {}
      : { holdsUntil: at({ now, day: ticket.holdsUntilDay, time: "23:59", timeZone }) };
  return {
    desiredStartsAt: at({ now, day: ticket.day, time: ticket.from, timeZone }),
    desiredEndsAt: at({ now, day: ticket.day, time: ticket.to, timeZone }),
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

type FollowInput = { context: ExecuteContext; ticketId: string; userIds: readonly string[] };

/** Each user follows the ticket (ADR 0034). */
async function follow({ context, ticketId, userIds }: FollowInput): Promise<Result<true>> {
  for (const userId of userIds) {
    const input = { subjectType: "TICKET" as const, subjectId: ticketId, userId };
    const followed = await execute({ operation: followAssignment, input, context });
    if (!followed.ok) return followed;
  }
  return ok({ value: true });
}

type TicketInput = Omit<SeedTicketsInput, "tickets" | "now"> & {
  ticket: DemoTicket;
  now: Date;
};

async function seedTicket({ context, refs, userIds, zones, ticket, now }: TicketInput) {
  const type = refs.ticketTypes.get(ticket.type);
  if (!type) return missing({ what: `ticket type ${ticket.type}` });
  const customer = await context.db.customer.findFirst({ where: { name: ticket.customer } });
  if (!customer) return missing({ what: `customer ${ticket.customer}` });
  const people = resolvePeople({ userIds, ticket });
  if (!people.ok) return people;
  const fields = await resolveDemoFields({ context, fields: ticket.fields, type });
  if (!fields.ok) return fields;
  // Lines (and a template's line times) are local to the venue (ADR 0064).
  const lineAt = ({ time }: { time: string }) =>
    at({ now, day: ticket.day, time, timeZone: zones.lines });
  const created = ticket.template
    ? await createDemoTicketFromTemplate({
        ...{ context, template: ticket.template, customerId: customer.id },
        ...{ startsAt: lineAt({ time: ticket.from }) },
        ...{ headcount: ticket.headcount, assigneeId: people.value.assigneeId },
      })
    : await execute({
        operation: createTicket,
        input: {
          ...{ entityTypeId: type.id, customerId: customer.id },
          ...periodOf({ ticket, now, timeZone: zones.ticket }),
          ...{ estimatedHeadcount: ticket.headcount, assigneeId: people.value.assigneeId },
          fields: fields.value,
        },
        context,
      });
  if (!created.ok) return created;
  const ticketId = created.value.id;
  const followed = await follow({ context, ticketId, userIds: people.value.followerIds });
  if (!followed.ok) return followed;
  const lines = await seedDemoLines({ context, ticketId, ticket, at: lineAt });
  if (!lines.ok) return lines;
  const chosen = await seedTicketChoices({ ...{ context, ticketId, userIds }, ticket });
  if (!chosen.ok) return chosen;
  const moved = await moveStatus({ context, ticket, ticketId, now });
  return moved.ok ? seedTicketMoney({ context, ticket, ticketId }) : moved;
}

/** Slice 5 of ADR 0025, started: tickets with a main assignee, followers and status, as SYSTEM. */
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
