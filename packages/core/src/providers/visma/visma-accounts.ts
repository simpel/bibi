import { ok, type Result } from "../../errors/result";
import type { ProviderAccount } from "../types";
import { codingFamily, codingRate, listCodings, salesAccountOf } from "./visma-articles";

export type ListVismaAccountsInput = { accessToken: string };

/**
 * What an invoice row can be coded as in Spiris (ADR 0123): the company's codings grouped into
 * families by name without the VAT part ("Tjänster 25% moms" and "Tjänster 12% moms" are
 * "Tjänster"), each with the VAT rates it has a coding for and the sales accounts under it. Bibi
 * picks the family's coding at a row's VAT rate. Reading only; codings cannot be created through
 * the API, so a missing rate is something the venue adds in Spiris.
 */
export async function listVismaAccounts({
  accessToken,
}: ListVismaAccountsInput): Promise<Result<ProviderAccount[]>> {
  const codings = await listCodings({ accessToken });
  if (!codings.ok) return codings;
  const families = new Map<string, ProviderAccount>();
  for (const coding of codings.value) {
    const name = codingFamily({ coding });
    if (!name) continue;
    const family = families.get(name.toLowerCase()) ?? {
      account: name,
      name,
      active: true,
      vatRates: [],
      accounts: [],
    };
    const rate = codingRate({ coding });
    if (rate >= 0 && !family.vatRates.includes(rate)) family.vatRates.push(rate);
    const sales = salesAccountOf({ coding });
    if (sales !== null && sales !== undefined && !family.accounts.includes(String(sales))) {
      family.accounts.push(String(sales));
    }
    families.set(name.toLowerCase(), family);
  }
  const list = [...families.values()].map((family) => ({
    ...family,
    vatRates: [...family.vatRates].sort((a, b) => b - a),
  }));
  return ok({ value: list.sort((a, b) => a.name.localeCompare(b.name, "sv")) });
}
