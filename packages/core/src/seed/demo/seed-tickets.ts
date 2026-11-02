import { ok, type Result } from "../../errors/result";
import { followAssignment } from "../../features/assignment/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoRefs } from "./demo-refs";
import type { DemoTimeZones } from "./demo-time-zones";
import { missing, resolveDemoFields } from "./seed-fields";
import { seedDemoLines } from "./seed-lines";
import { seedTicketMoney } from "./seed-money";
import { seedTicketChoices } from "./seed-ticket-choices";
import { at, createOne } from "./seed-ticket-create";
import { loadParty } from "./seed-ticket-party";
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
  const found = await loadParty({ context, customer: ticket.customer });
  if (!found.ok) return found;
  const people = resolvePeople({ userIds, ticket });
  if (!people.ok) return people;
  const fields = await resolveDemoFields({ context, fields: ticket.fields, type });
  if (!fields.ok) return fields;
  // Lines (and a template's line times) are local to the venue (ADR 0064).
  const lineAt = ({ time }: { time: string }) =>
    at({ now, day: ticket.day, time, timeZone: zones.lines });
  const party = { ...found.value, assigneeId: people.value.assigneeId };
  const made = { context, ticket, typeId: type.id, party, fields: fields.value, now, zones };
  const created = await createOne({ ...made, lineAt });
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
