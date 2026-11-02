import type { TicketCreateInput } from "../../features/ticket/schema";
import { createTicket } from "../../features/ticket/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { addDays } from "../../time/plain-date";
import { fromZonedParts, toZonedParts } from "../../time/zoned-time";
import type { DemoTimeZones } from "./demo-time-zones";
import { demoTitle } from "./demo-title";
import { createDemoTicketFromTemplate } from "./seed-ticket-from-template";
import type { DemoTicket } from "./ticket-types";

type AtInput = { now: Date; day: number; time: string; timeZone: string };

/** D + `day` at the local time `HH:MM` in `timeZone`. */
export function at({ now, day, time, timeZone }: AtInput): Date {
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

type CreateOneInput = {
  context: ExecuteContext;
  ticket: DemoTicket;
  typeId: string;
  party: { customerId: string; contactId: string; assigneeId: string | null };
  fields: TicketCreateInput["fields"];
  now: Date;
  zones: DemoTimeZones;
  lineAt: (input: { time: string }) => Date;
};

/** The ticket, from its predefined ticket or through `ticket.create`, named by `demoTitle`. */
export async function createOne({
  context,
  ticket,
  typeId,
  party,
  fields,
  now,
  zones,
  lineAt,
}: CreateOneInput) {
  const title = demoTitle({ ticket });
  if (ticket.template) {
    return createDemoTicketFromTemplate({
      ...{ context, template: ticket.template, ...party, title },
      ...{ startsAt: lineAt({ time: ticket.from }), headcount: ticket.headcount },
    });
  }
  const input = {
    ...{ entityTypeId: typeId, ...party, note: ticket.note, title, fields },
    ...periodOf({ ticket, now, timeZone: zones.ticket }),
    estimatedHeadcount: ticket.headcount,
  };
  return execute({ operation: createTicket, input, context });
}
