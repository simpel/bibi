import { z } from "zod";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { ProviderAccount } from "../types";
import { fortnoxGet } from "./fortnox-request";

const AccountsPageSchema = z.object({
  Accounts: z
    .array(
      z.object({
        Number: z.coerce.number(),
        Description: z.string().nullish(),
        Active: z.boolean().nullish(),
      }),
    )
    .default([]),
  MetaInformation: z.object({ "@TotalPages": z.coerce.number().optional() }).partial().optional(),
});

const PAGE_SIZE = 500;
const MAX_PAGES = 10;

export type ListFortnoxAccountsInput = { accessToken: string };

/**
 * The company's chart of accounts for the current financial year (ADR 0123), every page. A 403
 * means the token lacks the `bookkeeping` scope: `FORBIDDEN`, so the venue reconnects (the scope
 * grew with ADR 0123). Reading only. // Verify against Fortnox sandbox
 */
export async function listFortnoxAccounts({
  accessToken,
}: ListFortnoxAccountsInput): Promise<Result<ProviderAccount[]>> {
  const all: ProviderAccount[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const found = await fortnoxGet({
      path: `/accounts?page=${page}&limit=${PAGE_SIZE}`,
      accessToken,
    });
    if (!found.ok) return found;
    const { status, json } = found.value;
    if (status === 403) {
      const message = "Fortnox did not allow reading the accounts; reconnect Fortnox.";
      return err({ error: new AppError({ code: "FORBIDDEN", message }) });
    }
    const parsed = AccountsPageSchema.safeParse(json);
    if (status !== 200 || !parsed.success) {
      const message = `Fortnox refused the account list (${status}).`;
      return err({ error: new AppError({ code: "UNAVAILABLE", message }) });
    }
    for (const row of parsed.data.Accounts) {
      const account = String(row.Number);
      const name = row.Description?.trim() || account;
      all.push({ account, name, active: row.Active !== false, vatRates: [], accounts: [] });
    }
    if (page >= (parsed.data.MetaInformation?.["@TotalPages"] ?? 1)) break;
  }
  return ok({ value: all });
}
