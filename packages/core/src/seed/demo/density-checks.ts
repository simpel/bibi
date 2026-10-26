import type { ExecuteContext } from "../../operations/context";
import { addDays } from "../../time/plain-date";
import { fromZonedParts, toZonedParts } from "../../time/zoned-time";
import { minBlocksOn } from "./density-tickets";
import type { DemoDensity } from "./density-types";
import type { DemoOrg } from "./types";

export type CheckDemoDensityInput = { context: ExecuteContext; org: DemoOrg };

const MIDNIGHT = { hour: 0, minute: 0, second: 0 };

type DayInput = { density: DemoDensity; day: number; now: Date };

/** The day offset's local midnight and the next one, in the density's zone. */
function boundsOf({ density, day, now }: DayInput) {
  const timeZone = density.timeZone;
  const date = addDays({ date: toZonedParts({ instant: now, timeZone }).date, days: day });
  const next = addDays({ date, days: 1 });
  return {
    gte: fromZonedParts({ date, time: MIDNIGHT, timeZone }),
    lt: fromZonedParts({ date: next, time: MIDNIGHT, timeZone }),
  };
}

/**
 * The busy calendar (#488): every day of the window has at least the weekday's minimum of blocks,
 * lines that start that day on the density's assets and are not released. Returns failures.
 */
export async function checkDemoDensity({ context, org }: CheckDemoDensityInput): Promise<string[]> {
  const density = org.density;
  if (!density) return [];
  const now = new Date();
  const failures: string[] = [];
  for (let day = density.fromDay; day <= density.toDay; day += 1) {
    const blocks = await context.db.line.count({
      where: {
        startsAt: boundsOf({ density, day, now }),
        item: { name: { in: [...density.assets] } },
        NOT: { state: { released: true } },
      },
    });
    const min = minBlocksOn({ density, day, now });
    if (blocks < min)
      failures.push(
        `${org.slug}: D${day >= 0 ? "+" : ""}${day} has ${blocks} blocks, expected at least ${min}`,
      );
  }
  return failures;
}
