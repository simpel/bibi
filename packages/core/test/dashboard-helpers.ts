import { dashboardSummary, type ExecuteContext, execute } from "../src/index";

/** 07:00 in Stockholm on 1 November 2037: the calendar setup's holds are today. */
export const AT_SETUP_DAY = new Date(Date.UTC(2037, 10, 1, 6));

/** Four weeks from the setup day, the range most tests read. */
export const SETUP_RANGE = { from: "2037-11-01", to: "2037-11-28" };

type Range = { from: string; to: string };

/** This calendar month in UTC, around real time. */
export const thisMonth = (): Range => {
  const today = new Date().toISOString().slice(0, 10);
  const last = new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0));
  return { from: `${today.slice(0, 7)}-01`, to: last.toISOString().slice(0, 10) };
};

/** `dashboard.summary` at real time, for this month unless given a range. */
export const summary = ({ context, input }: { context: ExecuteContext; input?: Range }) =>
  execute({ operation: dashboardSummary, input: input ?? thisMonth(), context });

/** `dashboard.summary` with the clock at `AT_SETUP_DAY` (ADR 0064), over `SETUP_RANGE`. */
export const summaryAt = ({ context, input }: { context: ExecuteContext; input?: Range }) =>
  summary({ context: { ...context, now: () => AT_SETUP_DAY }, input: input ?? SETUP_RANGE });
