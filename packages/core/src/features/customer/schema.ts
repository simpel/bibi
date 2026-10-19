import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { FieldValuesSchema } from "../field-definition/field-values-schema";

export const CustomerSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  entityTypeId: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  invoiceStreetAddress: z.string().nullable(),
  invoicePostalCode: z.string().nullable(),
  invoiceCity: z.string().nullable(),
  invoiceCountry: z.string(),
  paymentTermsDays: z.number().int().nullable(),
  creditLimitMinor: z.number().int().nullable(),
  fields: FieldValuesSchema,
  ticketCount: z
    .number()
    .int()
    .nullable()
    .describe(
      "Number of the customer's tickets that are not archived; each blocks archiving it. " +
        "Null when the caller may not view tickets",
    ),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const CustomerCreateInputSchema = z.object({
  entityTypeId: z
    .string()
    .min(1)
    .describe("Id of the customer type (entityType.list base CUSTOMER)"),
  name: z.string().trim().min(1).max(200).describe("The customer's name, e.g. a company name"),
  email: z.email().nullish(),
  phone: z.string().trim().max(50).nullish(),
  invoiceStreetAddress: z.string().trim().max(200).nullish(),
  invoicePostalCode: z.string().trim().max(20).nullish(),
  invoiceCity: z.string().trim().max(100).nullish(),
  invoiceCountry: z.string().length(2).toUpperCase().optional().describe("ISO 3166-1 alpha-2"),
  paymentTermsDays: z
    .number()
    .int()
    .min(0)
    .max(365)
    .nullish()
    .describe("Days until an invoice is due; null = the organization's default"),
  creditLimitMinor: z
    .number()
    .int()
    .min(0)
    .max(2_000_000_000)
    .nullish()
    .describe("Credit limit in minor units (1/100 kr); null = no limit set"),
  fields: FieldValuesSchema.optional().describe("Values of the type's own fields, by field key"),
});

export const CustomerUpdateInputSchema = CustomerCreateInputSchema.omit({ entityTypeId: true })
  .partial()
  .extend({
    id: z.string().min(1),
    fields: FieldValuesSchema.optional().describe(
      "Changed field values by key; other fields are kept. null clears a value.",
    ),
  });

export const CustomerIdInputSchema = z.object({ id: z.string().min(1) });

export const CustomerArchiveInputSchema = z.object({
  id: z.string().min(1),
  archiveTickets: z
    .boolean()
    .default(false)
    .describe(
      "Also archive all of the customer's tickets that are not archived, in every phase. " +
        "Without it, any such ticket blocks archiving the customer.",
    ),
  expectedTicketCount: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe(
      "With archiveTickets: the number of not archived tickets the caller saw. Unless exactly " +
        "that many tickets are archived, the archive is refused with CONFLICT. In an assistant " +
        "proposal the server sets it to the current count; a value sent by the assistant is replaced.",
    ),
});

export const CustomerListInputSchema = z.object({
  ids: z
    .array(z.string().min(1))
    .max(100)
    .optional()
    .describe("Only these customers (e.g. to name the customers of tickets on a board)"),
  entityTypeId: z.string().optional().describe("Only customers of this type"),
  query: z.string().trim().max(200).optional().describe("Only customers whose name contains this"),
  ...PageInputShape,
});

export const CustomerListOutputSchema = z.object({
  items: z.array(CustomerSchema),
  nextCursor: z.string().nullable(),
});

export type CustomerDto = z.infer<typeof CustomerSchema>;
export type CustomerCreateInput = z.infer<typeof CustomerCreateInputSchema>;
export type CustomerUpdateInput = z.infer<typeof CustomerUpdateInputSchema>;
export type CustomerArchiveInput = z.input<typeof CustomerArchiveInputSchema>;
