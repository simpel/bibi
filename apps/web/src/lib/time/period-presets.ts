import { addDays, addMonths, type PlainDate, toIsoDate } from "@bibi/core/schemas";
import type { Period } from "@/features/finance/lib/finance-period";

/** The range picker's presets (ADR 0086): back from today, this month, or ahead from today. */
export const PERIOD_PRESETS = [
  { key: "last7Days", days: -7 },
  { key: "last30Days", days: -30 },
  { key: "thisMonth", month: true },
  { key: "last3Months", months: 3 },
  { key: "last12Months", months: 12 },
  { key: "next28Days", days: 28 },
] as const;

export type PeriodPreset = (typeof PERIOD_PRESETS)[number];
export type PeriodPresetKey = PeriodPreset["key"];

export type PresetPeriodInput = { today: PlainDate; preset: PeriodPreset };

const span = ({ from, to }: { from: PlainDate; to: PlainDate }): Period => ({
  from: toIsoDate({ date: from }),
  to: toIsoDate({ date: to }),
});

/**
 * The span a preset covers, today included: "last 7 days" is today and the six before it, "next 28
 * days" today and the 27 after it, "this month" the whole calendar month.
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
  return preset.days < 0
    ? span({ from: addDays({ date: today, days: preset.days + 1 }), to: today })
    : span({ from: today, to: addDays({ date: today, days: preset.days - 1 }) });
}
