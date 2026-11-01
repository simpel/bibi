import { addDays, addMonths, toIsoDate } from "../../time/plain-date";

/**
 * The range of the demo SIE export (ADR 0077): the last 12 months up to tomorrow, so everything
 * the seed creates "now" is inside it in any organization zone.
 */
export function demoExportRange({ now = new Date() }: { now?: Date } = {}) {
  const day = {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
  };
  return {
    from: toIsoDate({ date: addMonths({ date: day, months: -12 }) }),
    to: toIsoDate({ date: addDays({ date: day, days: 1 }) }),
  };
}
