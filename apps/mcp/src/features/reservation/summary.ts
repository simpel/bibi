import {
  createDateTimeFormat,
  DEFAULT_CLOCK_FORMAT,
  DEFAULT_DATE_FORMAT,
  effectiveTimeZone,
  execute,
  getReservation,
} from "@bibi/core";
import { type SummaryInput, text } from "../../tools/meta";

type WhenInput = { context: SummaryInput["context"]; value: unknown };

/** "4 Dec at 18:30" in the organization's zone (ADR 0064); the raw value when not a time. */
export async function whenText({ context, value }: WhenInput): Promise<string> {
  const instant = new Date(typeof value === "string" || value instanceof Date ? value : Number.NaN);
  if (Number.isNaN(instant.getTime())) return text({ value });
  const organization = await context.db.organizationProfile.findFirst({
    select: { timeZone: true },
  });
  const timeZone = effectiveTimeZone({ organization });
  const format = createDateTimeFormat({
    locale: "en",
    timeZone,
    formats: { dateFormat: DEFAULT_DATE_FORMAT, clockFormat: DEFAULT_CLOCK_FORMAT },
  });
  const day = format.date({ instant, year: false });
  const clock = format.time({ instant });
  return `${day} at ${clock}`;
}

/** "4 at 18:30 on 4 Dec": party size, then clock time and day. */
function partyAt({ size, when }: { size: unknown; when: string }): string {
  const [day, time] = when.split(" at ");
  return time
    ? `${text({ value: size })} at ${time} on ${day}`
    : `${text({ value: size })} at ${when}`;
}

/** "Book 4 at 18:30 on 4 Dec for Andersson". */
export async function createReservationSummary({ input, context }: SummaryInput) {
  const when = await whenText({ context, value: input.startsAt });
  return `Book ${partyAt({ size: input.partySize, when })} for ${text({ value: input.bookerName })}`;
}

/** "Edit the reservation for Anna Lind at 19:30 on 4 Dec: time, tables". */
export async function updateReservationSummary({ input, context }: SummaryInput) {
  const label = await reservationLabel({ input, context });
  const fields = Object.keys(input).filter((key) => key !== "id");
  return `Edit ${label}${fields.length > 0 ? `: ${fields.join(", ")}` : ""}`;
}

/** "the reservation for Anna Lind at 19:30 on 4 Dec", or its id when it cannot be read. */
async function reservationLabel({ input, context }: SummaryInput): Promise<string> {
  const id = text({ value: input.id });
  const found = await execute({ operation: getReservation, input: { id }, context });
  if (!found.ok) return `reservation ${id}`;
  const when = await whenText({ context, value: found.value.startsAt });
  const [day, time] = when.split(" at ");
  const who = found.value.bookerName ? ` for ${found.value.bookerName}` : "";
  return `the reservation${who} at ${time ?? when}${time ? ` on ${day}` : ""}`;
}

type VerbSummaryInput = { verb: string };

/** A lifecycle command's summary: "<Verb> the reservation for Anna Lind at 19:30 on 4 Dec". */
export function reservationVerbSummary({ verb }: VerbSummaryInput) {
  return async ({ input, context }: SummaryInput) =>
    `${verb} ${await reservationLabel({ input, context })}`;
}
