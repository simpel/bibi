import { z } from "zod";

/** A table held back by staff (ADR 0119): from everyone, or from guests only. */
export const TableBlockSchema = z.object({
  id: z.string(),
  elementId: z.string().describe("The table (a layout piece)"),
  label: z.string().nullable().describe("The table's number"),
  kind: z
    .enum(["BLOCK", "ONLINE_ONLY"])
    .describe("BLOCK: nobody books; ONLINE_ONLY: staff still may"),
  startsAt: z.date(),
  endsAt: z.date(),
  note: z.string().nullable(),
});

export const TableBlockListInputSchema = z.object({
  layoutId: z.string().min(1).optional().describe("Only tables of this layout"),
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export const TableBlockListOutputSchema = z.object({ items: z.array(TableBlockSchema) });

export const TableBlockCreateInputSchema = z
  .object({
    elementIds: z.array(z.string().min(1)).min(1).max(50).describe("Tables to block"),
    kind: z.enum(["BLOCK", "ONLINE_ONLY"]).default("BLOCK"),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    note: z.string().trim().max(200).nullable().default(null),
  })
  .refine((input) => input.endsAt > input.startsAt, {
    message: "Ends before it starts",
    path: ["endsAt"],
  });

export const TableBlockCreateOutputSchema = z.object({ items: z.array(TableBlockSchema) });

export const TableBlockIdInputSchema = z.object({ id: z.string().min(1) });

export type TableBlockDto = z.infer<typeof TableBlockSchema>;
