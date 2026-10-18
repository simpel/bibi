import type { DemoFieldValues } from "./config-types";

/**
 * A demo ticket (slice 5 of ADR 0025, `docs/demo-seed.md`). `ref` is the row in the spec (L1,
 * V3, …); `day` is the offset from the day of the run and `from`/`to` local times (HH:MM,
 * Europe/Stockholm) of the desired period on that day. Customer, type, phase and people are
 * referred to by name.
 */
export type DemoTicket = {
  ref: string;
  customer: string;
  type: string;
  day: number;
  from: string;
  to: string;
  headcount: number;
  /** The phase the ticket is moved to after it is created (ADR 0043); default: the entry phase. */
  phase?: string;
  /** The reason of that move, for phases that require one. */
  reason?: string;
  /** The main assignee (ADR 0034), by user name. */
  assignee?: string;
  /** Members who follow the ticket, by user name. */
  followers?: readonly string[];
  fields?: DemoFieldValues;
};
