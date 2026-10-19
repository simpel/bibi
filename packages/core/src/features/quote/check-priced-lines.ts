import { ok, type Result } from "../../errors/result";
import { invalid } from "../../shared/errors";
import type { DerivedLine } from "./derive-lines";

const MISSING = {
  quantity: "has no quantity: set its own or the ticket's headcount",
  vatRatePercent: "has no VAT rate: set it on the line, the item or the venue",
} as const;

export type CheckPricedLinesInput = { lines: readonly DerivedLine[]; what: string };

/**
 * A snapshot (a sent quote, an invoice, ADR 0052) needs at least one priced line, each with a
 * quantity and a VAT rate (`VALIDATION` on `lines.<n>.<field>`).
 */
export function checkPricedLines({ lines, what }: CheckPricedLinesInput): Result<true> {
  if (lines.length === 0) {
    const message = `${what} needs at least one priced line on the ticket`;
    return invalid({ message, issues: [{ path: "lines", message }] });
  }
  for (const [at, { line, missing }] of lines.entries()) {
    const [field] = missing;
    if (!field) continue;
    const message = `Line "${line.name}" ${MISSING[field]}`;
    return invalid({ message, issues: [{ path: `lines.${at}.${field}`, message }] });
  }
  return ok({ value: true });
}
