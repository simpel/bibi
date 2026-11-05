import { addDays, addMonths, type PlainDate, toIsoDate } from "@bibi/core/schemas";
import type { Period } from "@/features/finance/lib/finance-period";

/** Historical presets: back from today or whole months up to today. */
export const HISTORICAL_PERIOD_PRESETS = [
  { key: "last7Days", days: -7 },
  { key: "last30Days", days: -30 },
  { key: "thisMonth", month: true },
  { key: "last3Months", months: 3 },
  { key: "last12Months", months: 12 },
] as const;

/** Forward presets: from today into the future. */
export const FORWARD_PERIOD_PRESETS = [
  { key: "next7Days", days: 7 },
  { key: "next14Days", days: 14 },
  { key: "next30Days", days: 30 },
  { key: "next3Months", forwardMonths: 3 },
  { key: "next6Months", forwardMonths: 6 },
  { key: "next12Months", forwardMonths: 12 },
] as const;

/** All period presets combined. */
export const PERIOD_PRESETS = [
  ...HISTORICAL_PERIOD_PRESETS,
  { key: "next28Days", days: 28 },
  ...FORWARD_PERIOD_PRESETS,
] as const;

export type PeriodPreset =
  | (typeof HISTORICAL_PERIOD_PRESETS)[number]
  | (typeof FORWARD_PERIOD_PRESETS)[number]
  | { key: "next28Days"; days: 28 };

export type PeriodPresetKey = PeriodPreset["key"];

export type PresetPeriodInput = { today: PlainDate; preset: PeriodPreset };

const span = ({ from, to }: { from: PlainDate; to: PlainDate }): Period => ({
  from: toIsoDate({ date: from }),
  to: toIsoDate({ date: to }),
});

/**
 * The span a preset covers, today included: "last 7 days" is today and the six before it, "next 30
 * days" today and the 29 after it, "this month" the whole calendar month.
 */
export function presetPeriod({ today, preset }: PresetPeriodInput): Period {
  if ("month" in preset) {
    const first = { ...today, day: 1 };
    return span({
      from: first,
      to: addDays({ date: addMonths({ date: first, months: 1 }), days: -1 }),
    });
  }
  if ("months" in preset) {
    const from = addDays({ date: addMonths({ date: today, months: -preset.months }), days: 1 });
    return span({ from, to: today });
  }
  if ("forwardMonths" in preset) {
    const to = addDays({ date: addMonths({ date: today, months: preset.forwardMonths }), days: -1 });
    return span({ from: today, to });
  }
  return preset.days < 0
    ? span({ from: addDays({ date: today, days: preset.days + 1 }), to: today })
    : span({ from: today, to: addDays({ date: today, days: preset.days - 1 }) });
}
