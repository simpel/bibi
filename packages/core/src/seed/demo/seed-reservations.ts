import { ok, type Result } from "../../errors/result";
import {
  cancelReservation,
  completeReservation,
  markReservationNoShow,
  seatReservation,
} from "../../features/reservation/state-operations";
import { createReservation } from "../../features/reservation/write-operations";
import { createTableBlock } from "../../features/table-block/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { atDaysAhead } from "../../time/days-ahead";
import { nowOf } from "../../time/now";
import { addDays, weekdayOf } from "../../time/plain-date";
import { toZonedParts } from "../../time/zoned-time";
import type { DemoDining } from "./config-types";
import type { DemoRefs } from "./demo-refs";

export type SeedReservationsInput = {
  context: ExecuteContext;
  dining: DemoDining;
  refs: DemoRefs;
  itemId: string;
  tables: ReadonlyMap<string, string>;
  timeZone: string;
};

type PlansInput = { now: Date; timeZone: string; config: DemoDining["reservations"] };

type Plan = { day: number; time: string; party: number; needs?: number; after?: Outcome };
type Outcome = "SEATED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

const PARTIES = [2, 4, 3, 2, 5, 6, 2, 4, 8, 3, 2, 4];

/** Today's and yesterday's special cases, then the sittings of the next seven days. */
function plansFor({ now, timeZone, config }: PlansInput): Plan[] {
  const today = toZonedParts({ instant: now, timeZone }).date;
  const plans: Plan[] = config.outcomes
    ? [
        { day: 0, time: "11:30", party: 2, after: "COMPLETED" },
        { day: 0, time: "12:00", party: 4, after: "SEATED" },
        { day: -1, time: "18:30", party: 3, after: "NO_SHOW" },
        { day: 2, time: "19:00", party: 2, after: "CANCELLED" },
      ]
    : [];
  let counter = 0;
  const next = () => PARTIES[counter++ % PARTIES.length] ?? 2;
  for (let day = 0; day <= config.days; day++) {
    const weekday = weekdayOf({ date: addDays({ date: today, days: day }) });
    if (config.lunchWeekdays.includes(weekday)) {
      for (const time of config.lunchTimes) plans.push({ day, time, party: next() });
    }
    if (config.dinnerWeekdays.includes(weekday)) {
      for (const time of config.dinnerTimes) {
        const party = next();
        plans.push({ day, time, party, ...(counter % 4 === 0 ? { needs: counter } : {}) });
      }
    }
  }
  return plans;
}

const OUTCOMES = {
  SEATED: [seatReservation],
  COMPLETED: [seatReservation, completeReservation],
  CANCELLED: [cancelReservation],
  NO_SHOW: [markReservationNoShow],
} as const;

/**
 * ADR 0119: about 30 staff reservations for the restaurant room over today and the next seven
 * days with a few need counts, one seated, one completed, one cancelled and one no-show, and an
 * online-only block on tables 11 and 12 tonight, through `reservation.*` and `tableBlock.create`.
 */
export async function seedDemoReservations({
  context,
  dining,
  refs,
  itemId,
  tables,
  timeZone,
}: SeedReservationsInput): Promise<Result<true>> {
  const now = nowOf({ context });
  const elementIds = (dining.reservations.blockTables ?? []).flatMap((label) => {
    const id = tables.get(label);
    return id ? [id] : [];
  });
  const block = {
    elementIds,
    kind: "ONLINE_ONLY" as const,
    startsAt: atDaysAhead({ now, days: 0, time: "17:00", timeZone }),
    endsAt: atDaysAhead({ now, days: 0, time: "23:00", timeZone }),
    note: "Kept for walk-ins",
  };
  if (elementIds.length > 0) {
    const blocked = await execute({ operation: createTableBlock, input: block, context });
    if (!blocked.ok) return blocked;
  }
  const needValues = dining.needs.flatMap(({ list, value }) => {
    const id = refs.lists.get(list)?.values.find((candidate) => candidate.name === value)?.id;
    return id ? [id] : [];
  });
  let guest = 0;
  for (const plan of plansFor({ now, timeZone, config: dining.reservations })) {
    const who = dining.guests[guest++ % dining.guests.length];
    const need = plan.needs === undefined ? undefined : needValues[plan.needs % needValues.length];
    const input = {
      ...{ roomItemId: itemId, partySize: plan.party, bookerName: who?.name ?? "Guest" },
      ...{ startsAt: atDaysAhead({ now, days: plan.day, time: plan.time, timeZone }) },
      bookerPhone: who?.phone ?? null,
      ...(need ? { requirements: [{ vocabularyValueId: need, quantity: 1 }] } : {}),
    };
    const created = await execute({ operation: createReservation, input, context });
    if (!created.ok) {
      // A taken table is a normal outcome of a busy day; the other reservations stay.
      if (created.error.code === "CONFLICT") continue;
      return created;
    }
    for (const operation of plan.after ? OUTCOMES[plan.after] : []) {
      const moved = await execute({ operation, input: { id: created.value.id }, context });
      if (!moved.ok) return moved;
    }
  }
  return ok({ value: true });
}
