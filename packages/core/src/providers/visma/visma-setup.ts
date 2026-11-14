import { ok, type Result } from "../../errors/result";
import type { SetupIssue, SetupNeeds } from "../types";
import { codingRate, listCodings, onBalanceSheet, salesAccountOf } from "./visma-articles";

export type CheckVismaSetupInput = { accessToken: string; needs: SetupNeeds };

/**
 * Whether the company's account codings fit what Bibi books (ADR 0108): at each VAT rate in use a
 * coding that books to revenue and one that books to the advances account (a missing one stops
 * an invoice or a deposit), and for each mapped revenue account a coding that books to it (a
 * missing one means that account's rows use the company's default coding). Reading only.
 * // Verify against Visma sandbox
 */
export async function checkVismaSetup({
  accessToken,
  needs,
}: CheckVismaSetupInput): Promise<Result<SetupIssue[]>> {
  const codings = await listCodings({ accessToken });
  if (!codings.ok) return codings;
  const advances = Number(needs.advancesAccount);
  const issues: SetupIssue[] = [];
  for (const vatPercent of needs.vatRates) {
    const atRate = codings.value.filter((coding) => codingRate({ coding }) === vatPercent);
    const revenue = atRate.some(
      (coding) => !onBalanceSheet({ account: salesAccountOf({ coding }) }),
    );
    if (!revenue) issues.push({ code: "REVENUE_CODING_MISSING", account: null, vatPercent });
    if (!atRate.some((coding) => salesAccountOf({ coding }) === advances)) {
      issues.push({ code: "ADVANCES_CODING_MISSING", account: needs.advancesAccount, vatPercent });
    }
  }
  for (const account of needs.revenueAccounts) {
    if (!codings.value.some((coding) => salesAccountOf({ coding }) === Number(account))) {
      issues.push({ code: "ACCOUNT_NOT_CODED", account, vatPercent: null });
    }
  }
  return ok({ value: issues });
}
