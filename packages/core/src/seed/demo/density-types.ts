import type { DemoFieldValues } from "./config-types";
import type { DemoOrder } from "./order-types";

/** Who a generated order is for and who works it; the orders take the shapes in turn. */
export type DensityShape = {
  customer: string;
  type: string;
  /** What the order's lines are called, e.g. "Kickoff". */
  label: string;
  headcount: number;
  assignee: string;
  followers?: readonly string[];
  fields?: DemoFieldValues;
};

/** A block's local times on its day (HH:MM, the venue's zone). */
export type DensitySlot = { from: string; to: string };

/** The status a generated order is moved to, and the quote item a quote event needs. */
export type DensityStatus = Pick<DemoOrder, "status" | "quote">;

/**
 * A busy calendar (#488): for each day from `fromDay` to `toDay`, a number of blocks by the
 * day's weekday, each on its own asset, grouped into orders of up to `perOrder` blocks.
 * Assets a fixture order uses on a day are left alone that day, so the fixtures' checks keep
 * their meaning; every block is on a different asset, so no two blocks can collide.
 */
export type DemoDensity = {
  /** Refs of the generated orders: `G1`, `G2`, … */
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
  perOrder: number;
  /** Bookable items that come along on each block, by name, taken in turn (a skipper). */
  crew?: readonly string[];
  shapes: readonly DensityShape[];
  statusOf: (input: { day: number; index: number }) => DensityStatus;
};
