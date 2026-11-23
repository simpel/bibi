import { z } from "zod";

/**
 * Business or private (ADR 0106): what an order's money needs. A customer type carries one, a
 * new customer takes its type's, and orders inherit the customer's.
 */
export const BuyerKindSchema = z
  .enum(["BUSINESS", "PRIVATE"])
  .describe(
    "BUSINESS: a company, agency or association, always invoiced in full. PRIVATE: a private " +
      "person, who pays up front",
  );

export type BuyerKindValue = z.infer<typeof BuyerKindSchema>;
