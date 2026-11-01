import { dashboardSummary, type ExecuteContext, execute } from "../src/index";

/** 07:00 in Stockholm on 1 November 2037: the calendar setup's holds are today. */
export const AT_SETUP_DAY = new Date(Date.UTC(2037, 10, 1, 6));

/** `dashboard.summary` at real time. */
export const summary = ({ context }: { context: ExecuteContext }) =>
  execute({ operation: dashboardSummary, input: {}, context });

/** `dashboard.summary` with the clock at `AT_SETUP_DAY` (ADR 0064). */
export const summaryAt = ({ context }: { context: ExecuteContext }) =>
  summary({ context: { ...context, now: () => AT_SETUP_DAY } });
