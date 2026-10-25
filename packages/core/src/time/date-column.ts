import { type PlainDate, parseIsoDate } from "./plain-date";

/**
 * A plain date in a Postgres `DATE` column (ADR 0064 rule 10a). Prisma maps `DATE` to a `Date`
 * at UTC midnight, so the conversion reads and writes UTC parts only; no zone is involved.
 */
export function toDateColumn({ date }: { date: string }): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

/** A `DATE` column value → `YYYY-MM-DD`. */
export function fromDateColumn({ value }: { value: Date }): string {
  return value.toISOString().slice(0, 10);
}

/** A `DATE` column value → PlainDate. */
export function plainDateOfColumn({ value }: { value: Date }): PlainDate {
  return parseIsoDate({ value: fromDateColumn({ value }) });
}
