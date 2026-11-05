import "server-only";
import { getEnv } from "@bibi/config";
import { getLogger } from "@bibi/logger";
import { cache } from "react";

/** Operations one request may run before development logs a warning (ADR 0097). */
export const OPERATION_BUDGET = 25;

const requestCount = cache((): { count: number } => ({ count: 0 }));

export type OverBudgetInput = { count: number; budget?: number };

/** True only on the call that first goes over the budget, so a request warns once. */
export function crossesBudget({ count, budget = OPERATION_BUDGET }: OverBudgetInput): boolean {
  return count === budget + 1;
}

export type CountOperationInput = { name: string };

/**
 * Counts the request's operations and, outside production, warns once when it passes the
 * budget: a page that reads too much shows up in the dev log, not in production.
 */
export function countOperation({ name }: CountOperationInput): void {
  if (getEnv().NODE_ENV === "production") return;
  const counter = requestCount();
  counter.count += 1;
  if (!crossesBudget({ count: counter.count })) return;
  getLogger().warn({
    event: "web.request.op_budget",
    budget: OPERATION_BUDGET,
    operation: name,
    msg: `request ran more than ${OPERATION_BUDGET} operations (ADR 0097)`,
  });
}
