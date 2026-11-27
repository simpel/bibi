import { describe, expect, it } from "vitest";
import { deriveSetupIssues } from "../src/features/integration/mapping-issues";

const fortnox = {
  readable: true,
  accounts: [
    { account: "2420", name: "Advances", active: true, vatRates: [], accounts: [] },
    { account: "3001", name: "Sales", active: true, vatRates: [], accounts: [] },
    { account: "3002", name: "Old", active: false, vatRates: [], accounts: [] },
  ],
};

const spiris = {
  readable: true,
  accounts: [
    {
      account: "Tjänster",
      name: "Tjänster",
      active: true,
      vatRates: [25, 12],
      accounts: ["3041", "3042"],
    },
    { account: "Förskott", name: "Förskott", active: true, vatRates: [25], accounts: ["2420"] },
  ],
};

const map = ({
  purpose,
  ref,
}: {
  purpose: "ADVANCES" | "REVENUE_DEFAULT" | "ENTITY_TYPE";
  ref: string;
}) => ({
  purpose,
  entityTypeId: purpose === "ENTITY_TYPE" ? "type-1" : null,
  providerAccount: ref,
});

describe("derived setup issues (ADR 0123)", () => {
  it("knows nothing before the accounts were read", () => {
    const issues = deriveSetupIssues({
      chart: null,
      mappings: [map({ purpose: "ADVANCES", ref: "2420" })],
      vatRates: [25],
    });
    expect(issues).toEqual([]);
  });

  it("is one issue when the accounts could not be read", () => {
    const chart = { readable: false, accounts: [] };
    expect(deriveSetupIssues({ chart, mappings: [], vatRates: [25] })).toEqual([
      { code: "ACCOUNTS_UNAVAILABLE", account: null, vatPercent: null },
    ]);
  });

  it("names a mapped account the system lacks or has inactive, once", () => {
    const mappings = [
      map({ purpose: "ADVANCES", ref: "2420" }),
      map({ purpose: "REVENUE_DEFAULT", ref: "3002" }),
      map({ purpose: "ENTITY_TYPE", ref: "3002" }),
      map({ purpose: "ENTITY_TYPE", ref: "9999" }),
    ];
    expect(deriveSetupIssues({ chart: fortnox, mappings, vatRates: [25] })).toEqual([
      { code: "ACCOUNT_MISSING", account: "3002", vatPercent: null },
      { code: "ACCOUNT_MISSING", account: "9999", vatPercent: null },
    ]);
  });

  it("names a VAT rate in use that a Spiris family has no coding for", () => {
    const mappings = [
      map({ purpose: "REVENUE_DEFAULT", ref: "Tjänster" }),
      map({ purpose: "ADVANCES", ref: "Förskott" }),
    ];
    expect(deriveSetupIssues({ chart: spiris, mappings, vatRates: [25, 12, 6] })).toEqual([
      { code: "REVENUE_CODING_MISSING", account: "Tjänster", vatPercent: 6 },
      { code: "ADVANCES_CODING_MISSING", account: "Förskott", vatPercent: 12 },
      { code: "ADVANCES_CODING_MISSING", account: "Förskott", vatPercent: 6 },
    ]);
  });

  it("finds a family from a migrated account number", () => {
    const mappings = [map({ purpose: "REVENUE_DEFAULT", ref: "3042" })];
    expect(deriveSetupIssues({ chart: spiris, mappings, vatRates: [25] })).toEqual([]);
  });
});
