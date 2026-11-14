import { ok, type Result } from "../../errors/result";
import type { ProviderInvoiceRow } from "../invoice-rows";
import {
  articleFor,
  type Coding,
  type LoadCodings,
  listCodings,
  type RowKind,
} from "./visma-articles";

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
 * Visma rows on Bibi's article for each VAT rate and account: a revenue row on the article coded
 * to its own account when the company has such a coding, else on its default article; an advance
 * row on its advances article (ADR 0106, 0108). The article's coding picks the account, so the
 * row's own account is not sent. The company's codings are read lazily, once per call.
 */
export async function toVismaRows({
  accessToken,
  rows,
}: ToVismaRowsInput): Promise<Result<VismaRow[]>> {
  // Read at most once per call, and only when an article has to be created.
  let read: Promise<Result<readonly Coding[]>> | null = null;
  const codings: LoadCodings = () => {
    read ??= listCodings({ accessToken });
    return read;
  };
  const articles = new Map<string, string>();
  const out: VismaRow[] = [];
  for (const row of rows) {
    const kind: RowKind = { advance: row.advance, account: row.accountNumber };
    const key = `${row.advance ? "adv" : "vat"}:${row.vatPercent}:${row.accountNumber}`;
    let article = articles.get(key);
    if (!article) {
      const found = await articleFor({
        accessToken,
        vatPercent: row.vatPercent,
        kind,
        codings,
      });
      if (!found.ok) return found;
      article = found.value;
      articles.set(key, article);
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
