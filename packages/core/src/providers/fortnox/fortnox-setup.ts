import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { SetupIssue, SetupNeeds } from "../types";
import { fortnoxGet } from "./fortnox-request";

export type CheckFortnoxSetupInput = { accessToken: string; needs: SetupNeeds };

/**
 * Only a 404 says the account is not in the chart. Any other refusal (a scope the token lacks, a
 * financial year problem) is "could not check", never "missing": telling a venue to add an
 * account that exists would be worse than saying nothing.
 */
const isMissing = ({ status }: { status: number }) => status === 404;

/**
 * Whether every account Bibi books to exists, and is active, in the company's chart (ADR 0108):
 * one read per account, the advances account and each revenue account. Fortnox keeps the chart
 * per financial year; the lookup uses the current one. // Verify against Fortnox sandbox: the
 * 404 answer for a missing account, and whether the token's scopes (`FORTNOX_SCOPE`) may read
 * accounts: if Fortnox refuses with 403 the check reports UNAVAILABLE and the scope must grow.
 */
export async function checkFortnoxSetup({
  accessToken,
  needs,
}: CheckFortnoxSetupInput): Promise<Result<SetupIssue[]>> {
  const accounts = [...new Set([needs.advancesAccount, ...needs.revenueAccounts])];
  const issues: SetupIssue[] = [];
  for (const account of accounts) {
    const found = await fortnoxGet({
      path: `/accounts/${encodeURIComponent(account)}`,
      accessToken,
    });
    if (!found.ok) return found;
    const { status, json } = found.value;
    if (isMissing({ status })) {
      issues.push({ code: "ACCOUNT_MISSING", account, vatPercent: null });
      continue;
    }
    if (status !== 200) {
      const message = `Fortnox refused the account lookup (${status}).`;
      return err({ error: new AppError({ code: "UNAVAILABLE", message }) });
    }
    const active = (json.Account as { Active?: unknown } | undefined)?.Active;
    if (active === false) issues.push({ code: "ACCOUNT_MISSING", account, vatPercent: null });
  }
  return ok({ value: issues });
}
