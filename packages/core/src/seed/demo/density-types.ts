import type { DemoFieldValues } from "./config-types";
import type { DemoTicket } from "./ticket-types";

/** Who a generated ticket is for and who works it; the tickets take the shapes in turn. */
export type DensityShape = {
  customer: string;
  type: string;
  /** What the ticket's lines are called, with the ticket's ref: "Kickoff · Hönö (G4)". */
  label: string;
  headcount: number;
  assignee: string;
  followers?: readonly string[];
  fields?: DemoFieldValues;
};

/** A block's local times on its day (HH:MM, the venue's zone). */
export type DensitySlot = { from: string; to: string };

/** The status a generated ticket is moved to, and the quote item a quote event needs. */
export type DensityStatus = Pick<DemoTicket, "status" | "quote">;

/**
 * A busy calendar (#488): for each day from `fromDay` to `toDay`, a number of blocks by the
 * day's weekday, each on its own asset, grouped into tickets of up to `perTicket` blocks.
 * Assets a fixture ticket uses on a day are left alone that day, so the fixtures' checks keep
 * their meaning; every block is on a different asset, so no two blocks can collide.
 */
export type DemoDensity = {
  /** Refs of the generated tickets: `G1`, `G2`, … */
  prefix: string;
  /** The zone whose today decides each day's weekday (ADR 0064). */
  timeZone: string;
  fromDay: number;
  toDay: number;
  /** `[min, max]` blocks per day by ISO weekday, 0 = Monday … 6 = Sunday. */
  perWeekday: readonly (readonly [number, number])[];
  /** The bookable items the blocks go on, by name. */
  assets: readonly string[];
  /** The times of the i-th block of a day; with `rotateSlots` the list turns by day. */
  slots: readonly DensitySlot[];
  rotateSlots: boolean;
  perTicket: number;
  /** Bookable items that come along on each block, by name, taken in turn (a skipper). */
  crew?: readonly string[];
  shapes: readonly DensityShape[];
  statusOf: (input: { day: number; index: number }) => DensityStatus;
};
