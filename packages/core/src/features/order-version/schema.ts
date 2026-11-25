import { z } from "zod";
import { FieldValuesSchema } from "../field-definition/field-values-schema";
import { PriceEffectSchema } from "../item/customisation-group-schema";
import { LineRoleSchema } from "../line/line-role";
import { QuoteStatusSchema } from "../quote/schema";

/** One line as a version holds it (ADR 0116): the line's own content, not its state or holds. */
export const VersionLineSchema = z.object({
  lineId: z.string().describe("line.get; the line this snapshot pairs with"),
  parentLineId: z.string().nullable().describe("The line it is a part, option or add-on of"),
  role: LineRoleSchema.nullable(),
  alternativeGroupId: z.string().nullable().describe("alternativeGroup.get; null if ungrouped"),
  entityTypeId: z.string(),
  name: z.string(),
  startsAt: z.date().nullable(),
  endsAt: z.date().nullable(),
  itemId: z.string().nullable().describe("item.get"),
  layoutId: z.string().nullable(),
  setupMinutes: z.number().int().nullable(),
  teardownMinutes: z.number().int().nullable(),
  quantity: z.number().int().nullable().describe("null = inherit (headcount or parent line)"),
  unitPriceMinor: z.number().int().nullable().describe("Override; null = inherit"),
  discountPercent: z.number().nullable().describe("Override; null = inherit"),
  vatRatePercent: z.number().int().nullable().describe("Override; null = inherit"),
  priceEffect: PriceEffectSchema.nullable(),
  note: z.string().nullable(),
  fields: FieldValuesSchema,
});
export type VersionLine = z.infer<typeof VersionLineSchema>;

/** The properties a restore sets back on a line; `alternativeGroupId` is shown, not restored. */
export const VERSION_LINE_FIELDS = [
  "name",
  "startsAt",
  "endsAt",
  "itemId",
  "layoutId",
  "setupMinutes",
  "teardownMinutes",
  "quantity",
  "unitPriceMinor",
  "discountPercent",
  "vatRatePercent",
  "note",
  "fields",
  "alternativeGroupId",
] as const;
export const VersionLineFieldSchema = z.enum(VERSION_LINE_FIELDS);
export type VersionLineField = z.infer<typeof VersionLineFieldSchema>;

const HeadcountChangeSchema = z.object({
  from: z.number().int().nullable().describe("In the version"),
  to: z.number().int().nullable().describe("On the order now"),
});

/** How the order now differs from a version: what a restore would undo. */
export const VersionChangesSchema = z.object({
  added: z
    .array(VersionLineSchema)
    .describe("Lines on the order now that the version does not have (a restore removes them)"),
  removed: z
    .array(VersionLineSchema)
    .describe("Lines of the version the order no longer has (a restore brings them back)"),
  changed: z
    .array(
      z.object({
        line: VersionLineSchema.describe("The line as the version has it"),
        now: VersionLineSchema.describe("The line on the order now"),
        fields: z.array(VersionLineFieldSchema).min(1),
      }),
    )
    .describe("Lines in both whose content differs"),
  estimatedHeadcount: HeadcountChangeSchema.nullable().describe("Null when unchanged"),
  guaranteedHeadcount: HeadcountChangeSchema.nullable().describe("Null when unchanged"),
  count: z.number().int().describe("Lines added, removed or changed, plus headcounts changed"),
});
export type VersionChanges = z.infer<typeof VersionChangesSchema>;

const VersionQuoteSchema = z.object({
  id: z.string().describe("quote.get"),
  version: z.number().int().describe("The quote's own version number"),
  quoteStatus: QuoteStatusSchema,
  totalInclVatMinor: z.number().int().describe("The quote's total incl. VAT, minor units"),
});

export const OrderVersionSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  number: z.number().int().describe("1 for the order's first version, then one higher per version"),
  name: z.string().nullable().describe("A name staff gave it; null for an automatic version"),
  restoredFromId: z.string().nullable().describe("The version this one restored"),
  restoredFromNumber: z.number().int().nullable(),
  capturedAt: z.date().describe("When its content was last captured"),
  createdBy: z.string().nullable().describe("User id of who made the change it captured"),
  estimatedHeadcount: z.number().int().nullable(),
  guaranteedHeadcount: z.number().int().nullable(),
  lineCount: z.number().int(),
  isCurrent: z.boolean().describe("Its content equals the order now"),
  changeCount: z.number().int().describe("How many changes the order now has against it"),
  quotes: z
    .array(VersionQuoteSchema)
    .describe("The quotes sent as this version (needs quote:read, else empty)"),
  createdAt: z.date(),
});
export type OrderVersionDto = z.infer<typeof OrderVersionSchema>;

export const OrderVersionDetailSchema = OrderVersionSchema.extend({
  lines: z.array(VersionLineSchema).describe("The lines it holds, parents before sub-lines"),
  changes: VersionChangesSchema.describe("How the order now differs from it"),
});
export type OrderVersionDetail = z.infer<typeof OrderVersionDetailSchema>;

export const OrderVersionListInputSchema = z.object({
  orderId: z.string().min(1).describe("Id of the order (order.list)"),
});

export const OrderVersionListSchema = z.object({
  items: z.array(OrderVersionSchema).describe("Newest first"),
});
export type OrderVersionList = z.infer<typeof OrderVersionListSchema>;

export const OrderVersionIdInputSchema = z.object({
  id: z.string().min(1).describe("Id of the version (orderVersion.list)"),
});

export const OrderVersionNameInputSchema = z.object({
  id: z.string().min(1).describe("Id of the version (orderVersion.list)"),
  name: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .nullable()
    .describe("The name, e.g. Without the boat; null removes it"),
});
