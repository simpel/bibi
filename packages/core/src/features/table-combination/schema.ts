import { z } from "zod";

/** Tables of one layout booked together for one party (ADR 0119). */
export const TableCombinationSchema = z.object({
  id: z.string(),
  layoutId: z.string(),
  name: z.string(),
  elementIds: z.array(z.string()).describe("The tables (layout pieces) it joins, at least two"),
  minCovers: z.number().int().nullable().describe("Fewest people; null = 1"),
  maxCovers: z.number().int().nullable().describe("Most people; null = the tables' seats together"),
  onlineBookable: z.boolean().describe("Guests may get it on the booking page"),
});

export const TableCombinationListInputSchema = z.object({ layoutId: z.string().min(1) });

export const TableCombinationListOutputSchema = z.object({
  items: z.array(TableCombinationSchema),
});

export const TableCombinationInputSchema = z.object({
  id: z.string().min(1).optional().describe("A saved combination to keep; omitted = a new one"),
  name: z.string().trim().min(1).max(60).describe("e.g. Long table"),
  elementIds: z
    .array(z.string().min(1))
    .min(2)
    .max(20)
    .refine((ids) => new Set(ids).size === ids.length, { message: "A table twice" }),
  minCovers: z.number().int().min(1).nullable().default(null),
  maxCovers: z.number().int().min(1).nullable().default(null),
  onlineBookable: z.boolean().default(true),
});

export const TableCombinationSaveInputSchema = z.object({
  layoutId: z.string().min(1),
  combinations: z
    .array(TableCombinationInputSchema)
    .max(100)
    .describe("The layout's combinations as a whole; combinations left out are archived"),
});

export type TableCombinationDto = z.infer<typeof TableCombinationSchema>;
export type TableCombinationInput = z.infer<typeof TableCombinationInputSchema>;
