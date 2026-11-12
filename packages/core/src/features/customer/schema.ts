import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { ContactCreateInputSchema } from "../contact/schema";
import { FieldValuesSchema } from "../field-definition/field-values-schema";

/** Business or private (ADR 0106): what an order's money needs. Orders inherit the customer's. */
export const BuyerKindSchema = z
  .enum(["BUSINESS", "PRIVATE"])
  .describe(
    "BUSINESS: a company, agency or association, always invoiced in full. PRIVATE: a private " +
      "person, who pays up front",
  );

const OrganizationNumberSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .describe("The organisation number, e.g. 556677-8899; sent with invoices");

export const CustomerSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  entityTypeId: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  buyerKind: BuyerKindSchema,
  organizationNumber: z.string().nullable(),
  invoiceStreetAddress: z.string().nullable(),
  invoicePostalCode: z.string().nullable(),
  invoiceCity: z.string().nullable(),
  invoiceCountry: z.string(),
  paymentTermsDays: z.number().int().nullable(),
  creditLimitMinor: z.number().int().nullable(),
  fields: FieldValuesSchema,
  orderCount: z
    .number()
    .int()
    .nullable()
    .describe(
      "Number of the customer's orders that are not archived; each blocks archiving it. " +
        "Null when the caller may not view orders",
    ),
  valueMinor: z
    .number()
    .int()
    .nullable()
    .describe(
      "What the customer is billed so far in minor units (1/100 kr) incl. VAT: per active order " +
        "its sent invoices less credit notes, else its accepted quote; orders with neither count " +
        "0. Null when the caller may not view payments",
    ),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

/** The first contact person of a new customer (ADR 0081): the `contact.create` fields. */
export const CustomerFirstContactInputSchema = ContactCreateInputSchema.omit({
  customerId: true,
}).extend({
  entityTypeId: z
    .string()
    .min(1)
    .optional()
    .describe("Id of the contact type; omitted = the organization's only contact type"),
  email: z.email().describe("The person's email address"),
});

export const CustomerCreateInputSchema = z.object({
  entityTypeId: z
    .string()
    .min(1)
    .describe("Id of the customer type (entityType.list base CUSTOMER)"),
  name: z.string().trim().min(1).max(200).describe("The customer's name, e.g. a company name"),
  email: z.email().nullish(),
  phone: z.string().trim().max(50).nullish(),
  buyerKind: BuyerKindSchema.default("BUSINESS").describe(
    "Business or private; each order inherits it unless it sets its own. Default BUSINESS",
  ),
  organizationNumber: OrganizationNumberSchema.nullish(),
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
  contact: CustomerFirstContactInputSchema.optional().describe(
    "The customer's first contact person, created with it in the same command",
  ),
});

export const CustomerUpdateInputSchema = CustomerCreateInputSchema.omit({
  entityTypeId: true,
  contact: true,
})
  .partial()
  .extend({
    id: z.string().min(1),
    // Without a default: an update that omits it keeps the customer's.
    buyerKind: BuyerKindSchema.optional(),
    fields: FieldValuesSchema.optional().describe(
      "Changed field values by key; other fields are kept. null clears a value.",
    ),
  });

export const CustomerIdInputSchema = z.object({ id: z.string().min(1) });

export const CustomerArchiveInputSchema = z.object({
  id: z.string().min(1),
  archiveOrders: z
    .boolean()
    .default(false)
    .describe(
      "Also archive all of the customer's orders that are not archived, in every status. " +
        "Without it, any such order blocks archiving the customer.",
    ),
  expectedOrderCount: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe(
      "With archiveOrders: the number of not archived orders the caller saw. Unless exactly " +
        "that many orders are archived, the archive is refused with CONFLICT. In an assistant " +
        "proposal the server sets it to the current count; a value sent by the assistant is replaced.",
    ),
});

export const CustomerListInputSchema = z.object({
  ids: z
    .array(z.string().min(1))
    .max(100)
    .optional()
    .describe("Only these customers (e.g. to name the customers of orders on a board)"),
  entityTypeId: z.string().optional().describe("Only customers of this type"),
  query: z.string().trim().max(200).optional().describe("Only customers whose name contains this"),
  recent: z
    .boolean()
    .optional()
    .describe(
      "Order by each customer's latest order, newest first; customers without an order are " +
        "left out. Needs order:read",
    ),
  ...PageInputShape,
});

export const CustomerListOutputSchema = z.object({
  items: z.array(CustomerSchema),
  nextCursor: z.string().nullable(),
});

export type BuyerKind = z.infer<typeof BuyerKindSchema>;
export type CustomerDto = z.infer<typeof CustomerSchema>;
export type CustomerCreateInput = z.infer<typeof CustomerCreateInputSchema>;
export type CustomerFirstContactInput = z.infer<typeof CustomerFirstContactInputSchema>;
export type CustomerListInput = z.infer<typeof CustomerListInputSchema>;
export type CustomerUpdateInput = z.infer<typeof CustomerUpdateInputSchema>;
export type CustomerArchiveInput = z.input<typeof CustomerArchiveInputSchema>;
