import type { PlainDate } from "../../time/plain-date";
import { weekdayOf } from "../../time/plain-date";
import { fromZonedParts } from "../../time/zoned-time";
import type { TurnTime } from "../dining-service/schema";

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

/** What a sitting says about bookable times (ADR 0119), as stored. */
export type SittingRule = {
  id: string;
  layoutId: string;
  weekdays: readonly number[];
  firstStartMinute: number;
  lastStartMinute: number;
  slotMinutes: number;
  turnTimes: readonly TurnTime[];
  maxCoversPerSlot: number | null;
  validFrom: Date | null;
  validUntil: Date | null;
};

/** One date's exception to a sitting; null fields keep the sitting's. */
export type DayOverride = {
  closed: boolean;
  firstStartMinute: number | null;
  lastStartMinute: number | null;
  layoutId: string | null;
  maxCoversPerSlot: number | null;
};

/** How long a party keeps its table: the first row that covers it, else the last row. */
export function turnMinutes({
  turnTimes,
  partySize,
}: {
  turnTimes: readonly TurnTime[];
  partySize: number;
}): number {
  const row = turnTimes.find((turn) => partySize <= turn.upToParty) ?? turnTimes.at(-1);
  return row?.minutes ?? 120;
}

/** One bookable start of a sitting on a date, before tables and pace are checked. */
export type Candidate = {
  serviceId: string;
  layoutId: string;
  startsAt: Date;
  endsAt: Date;
  maxCoversPerSlot: number | null;
};

export type CandidatesInput = {
  date: PlainDate;
  timeZone: string;
  sitting: SittingRule;
  override: DayOverride | null;
  partySize: number;
};

/**
 * The sitting's starts on a local date (ADR 0119): on its weekdays, inside its season, every
 * `slotMinutes` from the first to the last start, as the day's exception changes them; none
 * when the exception closes it.
 */
export function candidateStarts({
  date,
  timeZone,
  sitting,
  override,
  partySize,
}: CandidatesInput): Candidate[] {
  if (override?.closed || !sitting.weekdays.includes(weekdayOf({ date }))) return [];
  const first = override?.firstStartMinute ?? sitting.firstStartMinute;
  const last = override?.lastStartMinute ?? sitting.lastStartMinute;
  const layoutId = override?.layoutId ?? sitting.layoutId;
  const maxCoversPerSlot = override?.maxCoversPerSlot ?? sitting.maxCoversPerSlot;
  const turn = turnMinutes({ turnTimes: sitting.turnTimes, partySize });
  const starts: Candidate[] = [];
  for (let minute = first; minute <= last; minute += sitting.slotMinutes) {
    const time = { hour: Math.floor(minute / 60), minute: minute % 60, second: 0 };
    const startsAt = fromZonedParts({ date, time, timeZone });
    if (sitting.validFrom && startsAt < sitting.validFrom) continue;
    if (sitting.validUntil && startsAt >= sitting.validUntil) continue;
    const endsAt = new Date(startsAt.getTime() + turn * MINUTE_MS);
    starts.push({ serviceId: sitting.id, layoutId, startsAt, endsAt, maxCoversPerSlot });
  }
  return starts;
}

/** The online booking window of a sitting (ADR 0119). */
export type WindowRule = { minMinutesAhead: number; maxDaysAhead: number; maxOnlineParty: number };

export type InWindowInput = {
  startsAt: Date;
  now: Date;
  rule: WindowRule;
  openUntil: Date | null;
  partySize: number;
};

/** Whether a guest may book this start online: far enough ahead, not too far, released, small enough. */
export function inOnlineWindow({ startsAt, now, rule, openUntil, partySize }: InWindowInput) {
  const ahead = startsAt.getTime() - now.getTime();
  return (
    partySize <= rule.maxOnlineParty &&
    ahead >= rule.minMinutesAhead * MINUTE_MS &&
    ahead <= rule.maxDaysAhead * DAY_MS &&
    (openUntil === null || startsAt < openUntil)
  );
}
