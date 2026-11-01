import { z } from "zod";

/** How wide one point of a trend line is (ADR 0086): days up to 31 days, weeks to 6 months, else months. */
export const BucketSizeSchema = z.enum(["DAY", "WEEK", "MONTH"]);
export type BucketSize = z.infer<typeof BucketSizeSchema>;

export const TrendPointSchema = z.object({
  bucket: z.string().describe("First day of the bucket, YYYY-MM-DD"),
  value: z.number().describe("The figure for the bucket: its sum, or the snapshot at its end"),
});

/**
 * A headline figure over the range (ADR 0086): the line, the value the card shows and the same
 * figure for the previous range of equal length. Derived on read, never stored (ADR 0051).
 */
export const TrendSchema = z.object({
  series: z.array(TrendPointSchema),
  current: z.number().describe("A sum over the range, or a snapshot at its end (capped at now)"),
  previous: z
    .number()
    .nullable()
    .describe("The previous range's sum, or the snapshot at this range's start"),
});

export type TrendPoint = z.infer<typeof TrendPointSchema>;
export type Trend = z.infer<typeof TrendSchema>;
