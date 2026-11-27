import type { ProviderAccount } from "../types";

const account = ({ number, name }: { number: string; name: string }): ProviderAccount => ({
  account: number,
  name,
  active: true,
  vatRates: [],
  accounts: [],
});

/** A small BAS chart for the fake ledger of tests and the demo seed (ADR 0123). */
export const BAS_ACCOUNTS: readonly ProviderAccount[] = [
  account({ number: "2420", name: "Förskott från kunder" }),
  account({ number: "3001", name: "Försäljning inom Sverige, 25 % moms" }),
  account({ number: "3010", name: "Försäljning lokalhyra" }),
  account({ number: "3051", name: "Försäljning mat" }),
  account({ number: "3052", name: "Försäljning dryck" }),
];
