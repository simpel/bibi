import { z } from "zod";
import { CustomerSchema } from "./schema";

export const CustomerFindSimilarInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .max(200)
      .optional()
      .describe("The new customer's name; case, punctuation and legal suffixes are ignored"),
    email: z
      .string()
      .trim()
      .max(320)
      .optional()
      .describe("An email of the new customer's contact; its domain is matched unless public"),
  })
  .refine((input) => Boolean(input.name) || Boolean(input.email), {
    message: "Give a name or an email",
    path: ["name"],
  });

export const SIMILAR_REASONS = ["NAME", "EMAIL_DOMAIN"] as const;

export const SimilarReasonSchema = z
  .enum(SIMILAR_REASONS)
  .describe(
    "NAME: the normalised names are equal or one contains the other; EMAIL_DOMAIN: a contact " +
      "of the customer has an email at the same (non-public) domain",
  );

export const SimilarCustomerSchema = z.object({
  customer: CustomerSchema,
  reasons: z.array(SimilarReasonSchema).min(1),
});

export const CustomerFindSimilarOutputSchema = z.object({
  items: z
    .array(SimilarCustomerSchema)
    .describe("At most 5 active customers, strongest match first"),
});

export type CustomerFindSimilarInput = z.infer<typeof CustomerFindSimilarInputSchema>;
export type SimilarReason = z.infer<typeof SimilarReasonSchema>;
export type SimilarCustomer = z.infer<typeof SimilarCustomerSchema>;
export type CustomerFindSimilar = z.infer<typeof CustomerFindSimilarOutputSchema>;
