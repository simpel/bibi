import type { DemoFieldValues } from "./config-types";

/**
 * A demo booking (slice 5 of ADR 0025, `docs/demo-seed.md`). `ref` is the row in the spec (L1,
 * V3, …); `day` is the offset from the day of the run and `from`/`to` local times (HH:MM,
 * Europe/Stockholm) on that day. Customer, type and people are referred to by name.
 */
export type DemoBooking = {
  ref: string;
  customer: string;
  type: string;
  day: number;
  from: string;
  to: string;
  headcount: number;
  /** The main assignee (ADR 0034), by user name. */
  assignee?: string;
  /** Members who follow the booking, by user name. */
  followers?: readonly string[];
  fields?: DemoFieldValues;
};
