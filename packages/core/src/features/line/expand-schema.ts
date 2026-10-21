import { z } from "zod";
import { FieldValuesSchema } from "../field-definition/field-values-schema";
import { LineSchema } from "./schema";

export const LineExpandBundleInputSchema = z.object({
  ticketId: z.string().min(1).describe("Id of the ticket (ticket.list)"),
  entityTypeId: z
    .string()
    .min(1)
    .describe("Id of the line type (entityType.list base LINE) of the bundle line and its parts"),
  itemId: z.string().min(1).describe("Id of a BUNDLE item (item.list capability BUNDLE)"),
  name: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .optional()
    .describe("Name of the bundle line; default the item's name"),
  startsAt: z.coerce
    .date()
    .nullish()
    .describe("Start of the bundle line, ISO 8601; leave out with endsAt for untimed lines"),
  endsAt: z.coerce.date().nullish().describe("End of the bundle line (after the start), ISO 8601"),
  quantity: z
    .number()
    .int()
    .min(0)
    .max(100_000)
    .nullish()
    .describe("How many bundles; null = the ticket's headcount (the parts follow it)"),
  fields: FieldValuesSchema.optional().describe(
    "Values of the line type's own fields, by field key, for every line created",
  ),
});

export const LineExpandBundleOutputSchema = z.object({
  items: z.array(LineSchema).describe("The bundle line first, then its part lines"),
});

export type LineExpandBundleInput = z.infer<typeof LineExpandBundleInputSchema>;
