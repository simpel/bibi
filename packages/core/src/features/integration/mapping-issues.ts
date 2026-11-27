import type { SetupIssue } from "../../providers/types";
import type { AccountMappingDto } from "../finance/mapping-schema";
import { type ChartSnapshot, chartEntryOf } from "./chart";

export type DeriveIssuesInput = {
  chart: ChartSnapshot | null;
  mappings: readonly AccountMappingDto[];
  /** The VAT rates of the organization's items, once each. */
  vatRates: readonly number[];
};

const key = ({ issue }: { issue: SetupIssue }) =>
  `${issue.code}:${issue.account}:${issue.vatPercent}`;

/**
 * What is wrong between the mappings and the accounting system's accounts (ADR 0123), derived on
 * read: nothing is known before the first read of the accounts; an unreadable list is one issue;
 * a mapped account the system lacks (or inactive); and, for a Spiris family, a VAT rate in use
 * that it has no coding for. Fortnox accounts carry no coding, so only presence is checked.
 */
export function deriveSetupIssues({ chart, mappings, vatRates }: DeriveIssuesInput): SetupIssue[] {
  if (!chart) return [];
  if (!chart.readable) return [{ code: "ACCOUNTS_UNAVAILABLE", account: null, vatPercent: null }];
  const issues = new Map<string, SetupIssue>();
  const add = ({ issue }: { issue: SetupIssue }) => issues.set(key({ issue }), issue);
  for (const mapping of mappings) {
    const ref = mapping.providerAccount;
    const entry = chartEntryOf({ chart, ref });
    if (!entry || !entry.active) {
      add({ issue: { code: "ACCOUNT_MISSING", account: ref, vatPercent: null } });
      continue;
    }
    if (entry.vatRates.length === 0) continue;
    const code =
      mapping.purpose === "ADVANCES" ? "ADVANCES_CODING_MISSING" : "REVENUE_CODING_MISSING";
    for (const vatPercent of vatRates) {
      if (!entry.vatRates.includes(vatPercent)) add({ issue: { code, account: ref, vatPercent } });
    }
  }
  return [...issues.values()];
}
