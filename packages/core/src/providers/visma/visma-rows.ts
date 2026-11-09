import { ok, type Result } from "../../errors/result";
import type { ProviderInvoiceRow } from "../invoice-rows";
import { articleFor } from "./visma-lookups";

/** One customer invoice row as eAccounting takes it. // Verify against Visma sandbox */
export type VismaRow = {
  ArticleId: string;
  Text: string;
  UnitPrice: number;
  Quantity: number;
  /** Visma takes the discount as a fraction (0.1 = 10 %). */
  DiscountPercentage: number;
};

export type ToVismaRowsInput = { accessToken: string; rows: readonly ProviderInvoiceRow[] };

/**
 * Bibi's provider rows (lines, bundle splits and deducted deposits per VAT rate, ADR 0093) as
 * Visma rows on Bibi's article for each VAT rate. The article's coding picks the account, so the
 * row's own account is not sent.
 */
export async function toVismaRows({
  accessToken,
  rows,
}: ToVismaRowsInput): Promise<Result<VismaRow[]>> {
  const articles = new Map<number, string>();
  const out: VismaRow[] = [];
  for (const row of rows) {
    let article = articles.get(row.vatPercent);
    if (!article) {
      const found = await articleFor({ accessToken, vatPercent: row.vatPercent });
      if (!found.ok) return found;
      article = found.value;
      articles.set(row.vatPercent, article);
    }
    out.push({
      ArticleId: article,
      Text: row.description.slice(0, 2000),
      UnitPrice: row.price,
      Quantity: row.quantity,
      DiscountPercentage: row.discountPercent / 100,
    });
  }
  return ok({ value: out });
}
