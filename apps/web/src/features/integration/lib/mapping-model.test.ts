import type { AccountMappingDto, ProviderAccountDto } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import {
  accountsOf,
  entryOf,
  parsePurposeId,
  purposeDefsOf,
  purposesOf,
  vatDetail,
  withMapping,
} from "./mapping-model";

const fortnox: ProviderAccountDto[] = [
  { account: "2420", name: "Förskott från kunder", active: true, vatRates: [], accounts: [] },
  { account: "3001", name: "Försäljning", active: true, vatRates: [], accounts: [] },
  { account: "3999", name: "Gammalt", active: false, vatRates: [], accounts: [] },
];
const spiris: ProviderAccountDto[] = [
  {
    account: "Tjänster",
    name: "Tjänster",
    active: true,
    vatRates: [12, 25],
    accounts: ["3041", "3042"],
  },
];
const texts = {
  advances: "Deposits",
  revenueDefault: "Default revenue",
  revenueDefaultHint: "Fallback",
  revenueType: ({ type }: { type: string }) => `Revenue: ${type}`,
};
const defs = purposeDefsOf({ types: [{ id: "t1", name: "Rooms" }], texts });
type MapInput = {
  purpose: AccountMappingDto["purpose"];
  account: string;
  entityTypeId?: string;
};
const map = ({ purpose, account, entityTypeId }: MapInput): AccountMappingDto => ({
  purpose,
  entityTypeId: entityTypeId ?? null,
  providerAccount: account,
});

describe("purposeDefsOf", () => {
  it("lists deposits, default revenue, then each item type", () => {
    expect(defs.map((def) => [def.id, def.required])).toEqual([
      ["ADVANCES", true],
      ["REVENUE_DEFAULT", true],
      ["ENTITY_TYPE:t1", false],
    ]);
    expect(defs[2]?.label).toBe("Revenue: Rooms");
  });

  it("round-trips a purpose id", () => {
    expect(parsePurposeId({ id: "ENTITY_TYPE:t1" })).toEqual({
      purpose: "ENTITY_TYPE",
      entityTypeId: "t1",
    });
    expect(parsePurposeId({ id: "ADVANCES" })).toEqual({ purpose: "ADVANCES", entityTypeId: null });
  });
});

describe("entryOf", () => {
  it("matches the reference or a number inside a family", () => {
    expect(entryOf({ chart: spiris, ref: "tjänster" })?.account).toBe("Tjänster");
    expect(entryOf({ chart: spiris, ref: "3042" })?.account).toBe("Tjänster");
    expect(entryOf({ chart: spiris, ref: "9999" })).toBeUndefined();
  });
});

describe("accountsOf", () => {
  it("labels Fortnox with number and name and marks inactive", () => {
    const accounts = accountsOf({ provider: "FORTNOX", chart: fortnox, mappings: [] });
    expect(accounts[1]?.label).toBe("3001 Försäljning");
    expect(accounts[2]?.inactive).toBe(true);
  });

  it("labels Spiris with the family and its VAT rates", () => {
    const [family] = accountsOf({ provider: "VISMA", chart: spiris, mappings: [] });
    expect(family).toEqual({ id: "Tjänster", label: "Tjänster", detail: "25 %, 12 %" });
    expect(vatDetail({ rates: [] })).toBeUndefined();
  });

  it("adds a mapped reference the system no longer lists", () => {
    const accounts = accountsOf({
      provider: "FORTNOX",
      chart: fortnox,
      mappings: [map({ purpose: "ADVANCES", account: "1234" })],
    });
    expect(accounts.at(-1)).toEqual({ id: "1234", label: "1234", inactive: true });
  });
});

describe("purposesOf", () => {
  const input = { defs, chart: spiris, attentionText: "Fix" };

  it("marks an unmapped required purpose as attention and an optional one as unmapped", () => {
    const purposes = purposesOf({ ...input, mappings: [], issueAccounts: [] });
    expect(purposes.map((purpose) => purpose.state)).toEqual([
      "attention",
      "attention",
      "unmapped",
    ]);
  });

  it("resolves a migrated number to its family and flags issues on the mapped reference", () => {
    const purposes = purposesOf({
      ...input,
      mappings: [
        map({ purpose: "ADVANCES", account: "Tjänster" }),
        map({ purpose: "REVENUE_DEFAULT", account: "3041" }),
        map({ purpose: "ENTITY_TYPE", account: "Tjänster", entityTypeId: "t1" }),
      ],
      issueAccounts: ["3041"],
    });
    expect(purposes.map((purpose) => purpose.accountId)).toEqual([
      "Tjänster",
      "Tjänster",
      "Tjänster",
    ]);
    expect(purposes.map((purpose) => purpose.state)).toEqual(["ok", "attention", "ok"]);
    expect(purposes[1]?.stateText).toBe("Fix");
  });
});

describe("withMapping", () => {
  it("replaces, adds and removes one purpose's mapping", () => {
    const start = [map({ purpose: "ADVANCES", account: "2420" })];
    const added = withMapping({ mappings: start, purposeId: "ENTITY_TYPE:t1", accountId: "3001" });
    expect(added).toEqual([
      map({ purpose: "ADVANCES", account: "2420" }),
      map({ purpose: "ENTITY_TYPE", account: "3001", entityTypeId: "t1" }),
    ]);
    const moved = withMapping({ mappings: added, purposeId: "ADVANCES", accountId: "3001" });
    expect(moved.find((mapping) => mapping.purpose === "ADVANCES")?.providerAccount).toBe("3001");
    expect(
      withMapping({ mappings: moved, purposeId: "ENTITY_TYPE:t1", accountId: null }),
    ).toHaveLength(1);
  });
});
