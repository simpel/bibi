import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { FieldValuesSchema } from "../field-definition/field-values-schema";

/** The buyer's reference (Er referens, ADR 0105): a case number or beställar-ID, ≤ 50. */
export const BuyerReferenceSchema = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .describe("The buyer's reference (case number, beställar-ID) their invoices must carry");

export const ContactSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  entityTypeId: z.string(),
  customerId: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  buyerReference: z
    .string()
    .nullable()
    .describe("The reference this person orders under; orders without their own inherit it"),
  fields: FieldValuesSchema,
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const ContactCreateInputSchema = z.object({
  customerId: z.string().min(1).describe("Id of the customer the person works for"),
  entityTypeId: z.string().min(1).describe("Id of the contact type (entityType.list base CONTACT)"),
  name: z.string().trim().min(1).max(200).describe("The person's full name"),
  email: z.email().nullish(),
  phone: z.string().trim().max(50).nullish(),
  buyerReference: BuyerReferenceSchema.nullish(),
  fields: FieldValuesSchema.optional().describe("Values of the type's own fields, by field key"),
});

export const ContactUpdateInputSchema = ContactCreateInputSchema.omit({
  customerId: true,
  entityTypeId: true,
})
  .partial()
  .extend({
    id: z.string().min(1),
    fields: FieldValuesSchema.optional().describe(
      "Changed field values by key; other fields are kept. null clears a value.",
    ),
  });

export const ContactIdInputSchema = z.object({ id: z.string().min(1) });

export const ContactListInputSchema = z.object({
  customerId: z.string().optional().describe("Only contacts at this customer"),
  entityTypeId: z.string().optional().describe("Only contacts of this type"),
  query: z.string().trim().max(200).optional().describe("Only contacts whose name contains this"),
  ...PageInputShape,
});

export const ContactListOutputSchema = z.object({
  items: z.array(ContactSchema),
  nextCursor: z.string().nullable(),
});

export type ContactDto = z.infer<typeof ContactSchema>;
export type ContactCreateInput = z.infer<typeof ContactCreateInputSchema>;
export type ContactUpdateInput = z.infer<typeof ContactUpdateInputSchema>;
