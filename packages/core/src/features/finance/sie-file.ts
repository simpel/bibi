import type { SieFile, SieVoucher } from "../../accounting/sie4/types";
import { addDays, addMonths, type PlainDate, toIsoDate } from "../../time/plain-date";
import { toZonedParts } from "../../time/zoned-time";
import type { ExportPlan } from "./plan-export";

const PROGRAM_NAME = "Bibi";
const PROGRAM_VERSION = "1.0";

/** The fiscal year that contains `day`, starting in the settings' first month. */
function fiscalYear({ day, startMonth }: { day: PlainDate; startMonth: number }) {
  const year = day.month >= startMonth ? day.year : day.year - 1;
  const start = { year, month: startMonth, day: 1 };
  const end = addDays({ date: addMonths({ date: start, months: 12 }), days: -1 });
  return { start: toIsoDate({ date: start }), end: toIsoDate({ date: end }) };
}

export type ToSieFileInput = { plan: ExportPlan; vouchers: readonly SieVoucher[]; now: Date };

/**
 * The SIE 4I file of one export (ADR 0077): header with the fiscal year of the range's first day,
 * the orders as projects, the vouchers.
 */
export function toSieFile({ plan, vouchers, now }: ToSieFileInput): SieFile {
  const today = toZonedParts({ instant: now, timeZone: plan.timeZone }).date;
  const rangeStart = toZonedParts({ instant: plan.period.start, timeZone: plan.timeZone }).date;
  const orders = [
    ...new Set(
      vouchers.flatMap((v) => v.transactions.flatMap((t) => t.objects ?? []).map((o) => o.id)),
    ),
  ].sort((a, b) => Number(a) - Number(b));
  return {
    programName: PROGRAM_NAME,
    programVersion: PROGRAM_VERSION,
    generatedOn: toIsoDate({ date: today }),
    orgNumber: plan.profile?.orgNumber ?? "",
    companyName: plan.profile?.legalName ?? "",
    fiscalYear: fiscalYear({ day: rangeStart, startMonth: plan.settings.fiscalYearStartMonth }),
    accounts: [],
    objects: orders.map((id) => ({ dimension: 6, id, name: `Order ${id}` })),
    vouchers,
  };
}
