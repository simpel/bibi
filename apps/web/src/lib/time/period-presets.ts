import { addDays, addMonths, type PlainDate, toIsoDate } from "@bibi/core/schemas";
import type { Period } from "@/features/finance/lib/finance-period";

export const PERIOD_PRESETS = [
  { key: "last7Days", days: 7 },
  { key: "last30Days", days: 30 },
  { key: "last3Months", months: 3 },
  { key: "last6Months", months: 6 },
] as const;

export type PeriodPresetKey = (typeof PERIOD_PRESETS)[number]["key"];

export type PresetPeriodInput = { today: PlainDate; preset: (typeof PERIOD_PRESETS)[number] };

/** The span a preset covers, ending today: 7 days is today and the six before it. */
export function presetPeriod({ today, preset }: PresetPeriodInput): Period {
  const from =
    "days" in preset
      ? addDays({ date: today, days: 1 - preset.days })
      : addDays({ date: addMonths({ date: today, months: -preset.months }), days: 1 });
  return { from: toIsoDate({ date: from }), to: toIsoDate({ date: today }) };
}
