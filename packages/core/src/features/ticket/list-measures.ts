import type { Prisma } from "@bibi/db";
import { fromZonedParts } from "../../time/zoned-time";
import { type DateRange, dateRange, type NumberRange, numberRange } from "./list-ranges";
import type { TICKET_EMPTY_FIELDS, TicketMeasure } from "./list-schema";

type Where = Prisma.TicketWhereInput;

/** The organization's zone (dates are its days, ADR 0064) and the request's instant. */
export type MeasureEnv = { zone: string; now: Date };

const NOTHING: Where = { id: { in: [] } };
const SOON_MS = 7 * 86_400_000;
const MIDNIGHT = { hour: 0, minute: 0, second: 0 };

const instants = ({ range, zone }: { range: DateRange; zone: string }) => {
  const at = ({ date }: { date: NonNullable<DateRange["from"]> }) =>
    fromZonedParts({ date, time: MIDNIGHT, timeZone: zone });
  return {
    ...(range.from ? { gte: at({ date: range.from }) } : {}),
    ...(range.until ? { lt: at({ date: range.until }) } : {}),
  };
};

const ints = ({ range, scale = 1 }: { range: NumberRange; scale?: number }) => ({
  ...(range.min !== undefined ? { gte: range.min * scale } : {}),
  ...(range.max !== undefined ? { lte: range.max * scale } : {}),
});

type MeasureInput = { value: string; env: MeasureEnv };

type DateField = "desiredStartsAt" | "createdAt" | "holdsUntil";

const dated =
  ({ field }: { field: DateField }) =>
  ({ value, env }: MeasureInput): Where => {
    const range = dateRange({ raw: value });
    return range ? { [field]: instants({ range, zone: env.zone }) } : NOTHING;
  };

/** `holds:expired`, `holds:soon` (within 7 days) or a date range on the hold date. */
const holds = ({ value, env }: MeasureInput): Where => {
  const now = env.now.getTime();
  const word = value.toLowerCase();
  if (word === "expired") return { holdsUntil: { lt: env.now } };
  if (word === "soon") return { holdsUntil: { gte: env.now, lt: new Date(now + SOON_MS) } };
  return dated({ field: "holdsUntil" })({ value, env });
};

/** The guaranteed headcount wins over the estimate, as on the ticket (ADR 0052). */
const guests = ({ value }: MeasureInput): Where => {
  const range = numberRange({ raw: value });
  if (!range) return NOTHING;
  const filter = ints({ range });
  return {
    OR: [
      { guaranteedHeadcount: filter },
      { guaranteedHeadcount: null, estimatedHeadcount: filter },
    ],
  };
};

/** The budget in whole currency units (kronor); stored in minor units. */
const budget = ({ value }: MeasureInput): Where => {
  const range = numberRange({ raw: value });
  return range ? { budgetMinor: ints({ range, scale: 100 }) } : NOTHING;
};

const EMPTY: Record<(typeof TICKET_EMPTY_FIELDS)[number], Where> = {
  assignee: {
    record: {
      assignments: {
        none: { responsibilityId: null, assigneeId: { not: null }, status: "ACTIVE" },
      },
    },
  },
  contact: { contactId: null },
  date: { desiredStartsAt: null },
  guests: { guaranteedHeadcount: null, estimatedHeadcount: null },
  budget: { budgetMinor: null },
  holds: { holdsUntil: null },
};

const MEASURES: Record<TicketMeasure, (input: MeasureInput) => Where> = {
  when: dated({ field: "desiredStartsAt" }),
  created: dated({ field: "createdAt" }),
  guests,
  budget,
  holds,
  no: ({ value }) => EMPTY[value.toLowerCase() as keyof typeof EMPTY] ?? NOTHING,
};

export type MeasureWhereInput = MeasureInput & { key: TicketMeasure };

/** One value of a date or number qualifier; an unreadable value matches nothing. */
export function measureWhere({ key, value, env }: MeasureWhereInput): Where {
  return MEASURES[key]({ value, env });
}
