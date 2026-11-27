import type {
  AccountMappingDto,
  AccountPurpose,
  IntegrationProvider,
  ProviderAccountDto,
} from "@bibi/core/schemas";
import type { MappingAccount, MappingPurpose } from "@bibi/ui";

/** One purpose before it is matched with a mapping: what the server writes in the user's language. */
export type PurposeDef = {
  id: string;
  label: string;
  hint?: string;
  required: boolean;
};

export type PurposeDefTexts = {
  advances: string;
  revenueDefault: string;
  revenueDefaultHint: string;
  revenueType: (input: { type: string }) => string;
};

export type PurposeDefsInput = {
  types: readonly { id: string; name: string }[];
  texts: PurposeDefTexts;
};

/** Deposits and Default revenue first, then one purpose per item type (ADR 0123). */
export function purposeDefsOf({ types, texts }: PurposeDefsInput): PurposeDef[] {
  return [
    { id: "ADVANCES", label: texts.advances, required: true },
    {
      id: "REVENUE_DEFAULT",
      label: texts.revenueDefault,
      hint: texts.revenueDefaultHint,
      required: true,
    },
    ...types.map((type) => ({
      id: `ENTITY_TYPE:${type.id}`,
      label: texts.revenueType({ type: type.name }),
      required: false,
    })),
  ];
}

export type ParsedPurposeId = { purpose: AccountPurpose; entityTypeId: string | null };

/** The mapping key a purpose id stands for. */
export function parsePurposeId({ id }: { id: string }): ParsedPurposeId {
  if (id.startsWith("ENTITY_TYPE:")) {
    return { purpose: "ENTITY_TYPE", entityTypeId: id.slice("ENTITY_TYPE:".length) };
  }
  return { purpose: id === "ADVANCES" ? "ADVANCES" : "REVENUE_DEFAULT", entityTypeId: null };
}

export function purposeIdOf({ mapping }: { mapping: AccountMappingDto }): string {
  return mapping.purpose === "ENTITY_TYPE"
    ? `ENTITY_TYPE:${mapping.entityTypeId ?? ""}`
    : mapping.purpose;
}

/**
 * The chart entry a mapping's reference names: the account itself, or (mappings migrated from old
 * numbers on Spiris) the family holding that number. Mirrors core's `chartEntryOf`.
 */
export function entryOf({
  chart,
  ref,
}: {
  chart: readonly ProviderAccountDto[];
  ref: string;
}): ProviderAccountDto | undefined {
  const lower = ref.toLowerCase();
  return (
    chart.find((entry) => entry.account.toLowerCase() === lower) ??
    chart.find((entry) => entry.accounts.includes(ref))
  );
}

export type AccountsInput = {
  provider: IntegrationProvider;
  chart: readonly ProviderAccountDto[];
  mappings: readonly AccountMappingDto[];
};

/** "25 %, 12 %": the VAT rates a Spiris family has a coding for, most used first. */
export function vatDetail({ rates }: { rates: readonly number[] }): string | undefined {
  if (rates.length === 0) return undefined;
  return [...rates]
    .sort((a, b) => b - a)
    .map((rate) => `${rate} %`)
    .join(", ");
}

/**
 * The accounts to draw. Fortnox: number and name. Spiris: the family name, its VAT rates as the
 * detail. A mapped reference the system no longer lists is added as an inactive account so its
 * line still shows.
 */
export function accountsOf({ provider, chart, mappings }: AccountsInput): MappingAccount[] {
  const listed: MappingAccount[] = chart.map((entry) => {
    const detail = vatDetail({ rates: entry.vatRates });
    return {
      id: entry.account,
      label:
        provider === "FORTNOX" && entry.name ? `${entry.account} ${entry.name}` : entry.account,
      ...(detail ? { detail } : {}),
      ...(entry.active ? {} : { inactive: true }),
    };
  });
  const known = new Set(listed.map((account) => account.id));
  const missing: MappingAccount[] = [];
  for (const mapping of mappings) {
    const id = entryOf({ chart, ref: mapping.providerAccount })?.account ?? mapping.providerAccount;
    if (known.has(id)) continue;
    known.add(id);
    missing.push({ id, label: id, inactive: true });
  }
  return [...listed, ...missing];
}

export type PurposesInput = {
  defs: readonly PurposeDef[];
  mappings: readonly AccountMappingDto[];
  chart: readonly ProviderAccountDto[];
  /** The references (mapped accounts) the problems found are about. */
  issueAccounts: readonly (string | null)[];
  attentionText: string;
};

/** Each purpose with its line, and whether it is fine, unmapped or needs attention. */
export function purposesOf({
  defs,
  mappings,
  chart,
  issueAccounts,
  attentionText,
}: PurposesInput): MappingPurpose[] {
  return defs.map((def) => {
    const mapping = mappings.find((found) => purposeIdOf({ mapping: found }) === def.id);
    const base = { id: def.id, label: def.label, hint: def.hint, required: def.required };
    if (!mapping) {
      return { ...base, accountId: null, state: def.required ? "attention" : "unmapped" };
    }
    const ref = mapping.providerAccount;
    const accountId = entryOf({ chart, ref })?.account ?? ref;
    const problem = issueAccounts.includes(ref);
    return {
      ...base,
      accountId,
      state: problem ? "attention" : "ok",
      stateText: problem ? attentionText : undefined,
    };
  });
}

export type WithMappingInput = {
  mappings: readonly AccountMappingDto[];
  purposeId: string;
  /** The account to book to; null removes the mapping. */
  accountId: string | null;
};

/** The mappings after one purpose is connected to an account or disconnected. */
export function withMapping({
  mappings,
  purposeId,
  accountId,
}: WithMappingInput): AccountMappingDto[] {
  const kept = mappings.filter((mapping) => purposeIdOf({ mapping }) !== purposeId);
  if (accountId === null) return kept;
  return [...kept, { ...parsePurposeId({ id: purposeId }), providerAccount: accountId }];
}
