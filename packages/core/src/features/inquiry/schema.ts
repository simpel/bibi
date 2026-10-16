import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { FieldValuesSchema } from "../field-definition/field-values-schema";

/** The inquiry's fixed sales status (ADR 0022); the allowed moves are in `transitions.ts`. */
export const INQUIRY_STATUSES = ["NEW", "QUALIFIED", "QUOTED", "WON", "LOST"] as const;
export const InquiryStatusSchema = z.enum(INQUIRY_STATUSES);

export const InquirySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  entityTypeId: z.string(),
  customerId: z.string(),
  contactId: z.string().nullable(),
  desiredStartsAt: z.date().nullable(),
  desiredEndsAt: z.date().nullable(),
  quantity: z.number().int().nullable(),
  budgetMinor: z.number().int().nullable(),
  /** Changed only by the inquiry's own commands (`inquiry.qualify`, `inquiry.markLost`, …). */
  inquiryStatus: InquiryStatusSchema,
  lossReason: z.string().nullable(),
  salesOwnerId: z.string().nullable(),
  statusChangedAt: z.date(),
  fields: FieldValuesSchema,
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const OwnerIdSchema = z.string().min(1);

const InquiryDetailsShape = {
  customerId: z.string().min(1).describe("Id of the customer who asks (customer.list)"),
  contactId: z
    .string()
    .min(1)
    .nullish()
    .describe("Id of a contact person at the customer (contact.list)"),
  desiredStartsAt: z.coerce.date().nullish().describe("Desired start, ISO 8601"),
  desiredEndsAt: z.coerce.date().nullish().describe("Desired end (after the start), ISO 8601"),
  quantity: z
    .number()
    .int()
    .min(0)
    .max(100_000)
    .nullish()
    .describe("Requested quantity, e.g. the number of guests"),
  budgetMinor: z
    .number()
    .int()
    .min(0)
    .nullish()
    .describe("Budget in minor units (1/100 of the currency)"),
};

export const InquiryCreateInputSchema = z.object({
  entityTypeId: z.string().min(1).describe("Id of the inquiry type (entityType.list base INQUIRY)"),
  ...InquiryDetailsShape,
  salesOwnerId: OwnerIdSchema.nullish().describe(
    "User id of the salesperson; must be a member (member.list userId)",
  ),
  fields: FieldValuesSchema.optional().describe("Values of the type's own fields, by field key"),
});

/** Status and owner are not here: they change only through the inquiry's own commands. */
export const InquiryUpdateInputSchema = z
  .object(InquiryDetailsShape)
  .partial()
  .extend({
    id: z.string().min(1),
    fields: FieldValuesSchema.optional().describe(
      "Changed field values by key; other fields are kept. null clears a value.",
    ),
  });

export const InquiryQualifyInputSchema = z.object({
  id: z.string().min(1),
  salesOwnerId: OwnerIdSchema.optional().describe(
    "User id of the salesperson (a member); required unless the inquiry already has one",
  ),
});

export const InquiryMarkLostInputSchema = z.object({
  id: z.string().min(1),
  lossReason: z.string().trim().min(1).max(1000).describe("Why the inquiry was lost"),
});

export const InquiryAssignInputSchema = z.object({
  id: z.string().min(1),
  salesOwnerId: OwnerIdSchema.nullable().describe(
    "User id of the new salesperson (a member); null removes the owner (only while NEW)",
  ),
});

export const InquiryIdInputSchema = z.object({ id: z.string().min(1) });

export const InquiryListInputSchema = z.object({
  customerId: z.string().optional().describe("Only inquiries from this customer"),
  entityTypeId: z.string().optional().describe("Only inquiries of this type"),
  inquiryStatus: InquiryStatusSchema.optional().describe("Only inquiries with this status"),
  salesOwnerId: z.string().optional().describe("Only inquiries owned by this user"),
  ...PageInputShape,
});

export const InquiryListOutputSchema = z.object({
  items: z.array(InquirySchema),
  nextCursor: z.string().nullable(),
});

export type InquiryStatus = z.infer<typeof InquiryStatusSchema>;
export type InquiryDto = z.infer<typeof InquirySchema>;
export type InquiryCreateInput = z.infer<typeof InquiryCreateInputSchema>;
export type InquiryUpdateInput = z.infer<typeof InquiryUpdateInputSchema>;
export type InquiryQualifyInput = z.infer<typeof InquiryQualifyInputSchema>;
export type InquiryMarkLostInput = z.infer<typeof InquiryMarkLostInputSchema>;
export type InquiryAssignInput = z.infer<typeof InquiryAssignInputSchema>;
