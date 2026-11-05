import { z } from "zod";

/** The order's title as create and update take it (owned, at most 120 characters). */
export const OrderTitleInputSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .nullish()
  .describe(
    "Short name of the order staff know it by, e.g. 'Saab kick-off with lunch'. On create, " +
      "left out: a title is generated after the order is created; null clears it",
  );
