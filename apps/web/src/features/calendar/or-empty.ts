import { ok, type Result } from "@bibi/core";

export type OrEmptyInput<T> = { result: Result<T[]> };

/**
 * Another feature's rows the calendar can do without (ADR 0050 feature scope): without `read`
 * on it the rows are simply empty, so the page degrades instead of failing.
 */
export const orEmpty = <T>({ result }: OrEmptyInput<T>): Result<T[]> =>
  !result.ok && result.error.code === "FORBIDDEN" ? ok({ value: [] }) : result;
