import { z } from "zod";
import { LineEffectiveShape } from "../line/effective-schema";
import { PreviewDraftLineSchema } from "./draft-line-schema";
import { PlanGroupSchema, PlanIssueSchema, PlanLineIssueSchema } from "./plan/issue-schema";

export const OrderPreviewLinesInputSchema = z.object({
  customerId: z
    .string()
    .min(1)
    .describe("Id of the customer who asks (customer.list); its price list sets the prices"),
  startsAt: z.coerce.date().describe("The requested start, ISO 8601; packages start here"),
  endsAt: z.coerce.date().describe("The requested end, ISO 8601, after the start"),
  headcount: z
    .number()
    .int()
    .min(0)
    .max(100_000)
    .describe("The estimated headcount; lines without a quantity count it"),
  templateIds: z
    .array(z.string().min(1))
    .min(1)
    .max(100)
    .optional()
    .describe("Packages (orderTemplate.list) to plan, one entry each; or give `lines`"),
  lines: z
    .array(PreviewDraftLineSchema)
    .min(1)
    .max(100)
    .optional()
    .describe(
      "Draft lines (with their `addOns`, ADR 0088) to plan as one entry; or give `templateIds`",
    ),
});

const { effectiveQuantity, quantitySource, effectiveUnitPriceMinor, unitPriceSource } =
  LineEffectiveShape;
const { effectiveDiscountPercent, discountSource } = LineEffectiveShape;

const PreviewRowShape = {
  index: z
    .number()
    .int()
    .describe("The line's position in its entry (an add-on's under its line), from 0"),
  entityTypeId: z.string().describe("The line type"),
  name: z.string(),
  itemId: z.string().nullable(),
  layoutId: z.string().nullable().describe("The layout of the item the line books (ADR 0103)"),
  startsAt: z.date().nullable().describe("Effective start; null for an untimed line"),
  endsAt: z.date().nullable().describe("Effective end; null for an untimed line"),
  quantity: z.number().int().nullable().describe("The line's own quantity; null = the headcount"),
  ...{ effectiveQuantity, quantitySource, effectiveUnitPriceMinor, unitPriceSource },
  ...{ effectiveDiscountPercent, discountSource },
  stateId: z
    .string()
    .nullable()
    .describe(
      "The item state the line would start in: the entry status's grid cell for its item " +
        "type, else the type's initial state (ADR 0081 decision 8); null without an item",
    ),
  issues: z
    .array(PlanLineIssueSchema)
    .describe(
      "What stands in the way or warns; SELF_OVERLAP's otherLineIndex names the line (or the " +
        "line whose add-on) it overlaps",
    ),
};

/** An add-on of a draft line, priced as its own line (ADR 0088: no parent discount). */
export const PreviewAddOnSchema = z.object(PreviewRowShape);

export const PreviewLineSchema = z.object({
  ...PreviewRowShape,
  options: z
    .array(z.object({ itemId: z.string() }))
    .describe(
      "A package line's default choices that still fit its item (ADR 0089), in order, as " +
        "order.create's line options; empty for draft lines",
    ),
  addOns: z
    .array(PreviewAddOnSchema)
    .describe(
      "The line's add-ons in the order given (ADR 0088): effective period (the line's unless " +
        "given), quantity (the line's unless given, source PARENT_LINE), unit price and discount " +
        "of their own, start state and issues; empty for a package's lines",
    ),
});

export const PreviewEntrySchema = z.object({
  templateId: z.string().nullable().describe("The package; null for the draft lines"),
  group: PlanGroupSchema.describe(
    "AVAILABLE (fits; warnings allowed), CLASHES (a line meets a hard hold or block), or " +
      "OUTSIDE_RANGE (outside the guest range or past the requested end, even if it also clashes)",
  ),
  endsAt: z.date().nullable().describe("When the last timed line ends; null when none is timed"),
  issues: z.array(PlanIssueSchema).describe("GUESTS_OUTSIDE_RANGE and PAST_REQUESTED_END"),
  firstFreeStart: z
    .date()
    .nullable()
    .describe(
      "The earliest start on the requested day (organization's zone), from the requested start " +
        "in 15-minute steps, at which no line has a hard clash when every line moves by the same " +
        "amount; null when none, or when availability is hidden",
    ),
  lines: z.array(PreviewLineSchema),
});

export const OrderPreviewLinesOutputSchema = z.object({
  statusId: z.string().describe("The entry status the lines would start in (orderStatus.get)"),
  availabilityHidden: z
    .boolean()
    .describe(
      "True without item:read: clashes, overlaps, layout capacity, pools and hours are left out",
    ),
  entries: z
    .array(PreviewEntrySchema)
    .describe("One per package in `templateIds` order, or one for the draft lines"),
});

export type OrderPreviewLinesInput = z.infer<typeof OrderPreviewLinesInputSchema>;
export type OrderPreviewLines = z.infer<typeof OrderPreviewLinesOutputSchema>;
export type PreviewEntry = z.infer<typeof PreviewEntrySchema>;
export type PreviewLine = z.infer<typeof PreviewLineSchema>;
export type PreviewAddOn = z.infer<typeof PreviewAddOnSchema>;
