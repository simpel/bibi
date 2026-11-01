import type { ExecuteContext } from "../../operations/context";

const DAY_MS = 86_400_000;

export type AtDayInput = { context: ExecuteContext; now: Date; day: number | undefined };

/** The context with its clock at `day` (offset from `now`, ADR 0064); unchanged without one. */
export const atDay = ({ context, now, day }: AtDayInput): ExecuteContext => {
  if (day === undefined) return context;
  const instant = new Date(now.getTime() + day * DAY_MS);
  return { ...context, now: () => instant };
};
