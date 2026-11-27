import { z } from "zod";
import { ok, type Result } from "../../errors/result";
import { conflict } from "../../shared/errors";
import { createObject, firstId, paged } from "./visma-lookups";
import { odataString, vismaCall, vismaRefused } from "./visma-request";

type Authed = { accessToken: string };

const accountNumber = z.coerce.number().nullish();

/** An account coding: its name, VAT rate (0.25) and the sales accounts it posts to. */
const CodingsSchema = paged({
  item: z.object({
    Id: z.string(),
    Name: z.string().nullish(),
    VatRatePercent: z.coerce.number().nullish(),
    IsActive: z.boolean().nullish(),
    DomesticSalesSubjectToVatAccountNumber: accountNumber,
    DomesticSalesVatExemptAccountNumber: accountNumber,
  }),
});
export type Coding = z.infer<typeof CodingsSchema>["Data"][number];

const UnitsSchema = paged({ item: z.object({ Id: z.string() }) });

/**
 * What a row is booked as (ADR 0106, 0123): revenue on the row's `account` reference, or a
 * customer advance on it (a prepayment invoice's rows and a deducted deposit, ADR 0093). The
 * reference is a coding family ("Tjänster") or, for mappings migrated from numbers, a sales
 * account number.
 */
export type RowKind = { advance: boolean; account: string };

/** The company's codings, read when an article must be created (and only then, once per call). */
export type LoadCodings = () => Promise<Result<readonly Coding[]>>;

type ArticleInput = Authed & { vatPercent: number; kind: RowKind; codings: LoadCodings };
type CodingInput = { vatPercent: number; kind: RowKind; codings: readonly Coding[] };

/** A coding's family: its name without the VAT part, "Tjänster 25% moms" → "Tjänster" (ADR 0123). */
export const codingFamily = ({ coding }: { coding: Coding }) => {
  const name = (coding.Name ?? "").trim();
  return name.replace(/\s*\d+(?:[.,]\d+)?\s*%.*$/u, "").trim() || name;
};

/** A reference that is an account number (migrated mappings), not a family name. */
export const isAccountNumber = ({ ref }: { ref: string }) => /^\d{3,6}$/.test(ref);

/** Whether the coding is the one a reference names: its sales account, or its family. */
function codingMatches({ coding, ref }: { coding: Coding; ref: string }) {
  if (isAccountNumber({ ref })) return salesAccountOf({ coding }) === Number(ref);
  return codingFamily({ coding }).toLowerCase() === ref.toLowerCase();
}

export const salesAccountOf = ({ coding }: { coding: Coding }) =>
  (coding.VatRatePercent ?? 0) === 0
    ? coding.DomesticSalesVatExemptAccountNumber
    : coding.DomesticSalesSubjectToVatAccountNumber;

/** A balance sheet account (BAS classes 1 and 2): never a revenue coding. */
export const onBalanceSheet = ({ account }: { account: number | null | undefined }) =>
  account !== null && account !== undefined && account < 3000;

/** The VAT rate of a coding as a whole percent (Visma reports a fraction, 0.25). */
export const codingRate = ({ coding }: { coding: Coding }) =>
  Math.round((coding.VatRatePercent ?? -1) * 100);

/** Codings per page; the API answers `Meta.TotalNumberOfPages` (sandbox 2026-11-27). */
const CODINGS_PAGE_SIZE = 100;
const MAX_CODING_PAGES = 20;

/** The company's active account codings, every page, read once per call. */
export async function listCodings({ accessToken }: Authed): Promise<Result<Coding[]>> {
  const all: Coding[] = [];
  for (let page = 1; page <= MAX_CODING_PAGES; page += 1) {
    const path = `/articleaccountcodings?$page=${page}&$pagesize=${CODINGS_PAGE_SIZE}`;
    const found = await vismaCall({ path, accessToken });
    if (!found.ok) return found;
    const parsed = CodingsSchema.safeParse(found.value.json);
    if (found.value.status !== 200 || !parsed.success) {
      return vismaRefused({ what: "the account codings", response: found.value });
    }
    all.push(...parsed.data.Data);
    if (page >= (parsed.data.Meta?.TotalNumberOfPages ?? 1)) break;
  }
  return ok({ value: all.filter((coding) => coding.IsActive !== false) });
}

const advanceMissing = ({ vatPercent, account }: { vatPercent: number; account: string }) =>
  (isAccountNumber({ ref: account })
    ? `Visma has no ${vatPercent} % VAT account coding that books sales to ${account}.`
    : `Visma has no ${vatPercent} % VAT account coding for "${account}".`) +
  " Create one in Visma (Settings → Account codings) so prepayments and their deductions land " +
  "on customer advances, then send again.";

type Chosen = { id: string; exact: boolean };

/**
 * The coding for a row (ADR 0106, 0108). An advance takes the coding at the rate that books to
 * the advances account. Revenue takes the one at the rate that books to the row's own account,
 * else (`exact: false`) the first one at the rate that does not book to the balance sheet, so a
 * mapped account the company has no coding for still invoices on its default.
 * // Verify against Visma sandbox
 */
function codingFor({ vatPercent, kind, codings }: CodingInput): Result<Chosen> {
  const atRate = codings.filter((coding) => codingRate({ coding }) === vatPercent);
  const books = ({ account }: { account: string }) =>
    atRate.find((coding) => codingMatches({ coding, ref: account }));
  if (kind.advance) {
    const match = books({ account: kind.account });
    return match
      ? ok({ value: { id: match.Id, exact: true } })
      : conflict({ message: advanceMissing({ vatPercent, account: kind.account }) });
  }
  const exact = books({ account: kind.account });
  if (exact) return ok({ value: { id: exact.Id, exact: true } });
  const fallback = atRate.find(
    (coding) => !onBalanceSheet({ account: salesAccountOf({ coding }) }),
  );
  return fallback
    ? ok({ value: { id: fallback.Id, exact: false } })
    : conflict({ message: `Visma has no ${vatPercent} % VAT coding` });
}

async function unitId({ accessToken }: Authed): Promise<Result<string>> {
  const found = await vismaCall({ path: "/units", accessToken });
  if (!found.ok) return found;
  const parsed = UnitsSchema.safeParse(found.value.json);
  const id = parsed.success ? parsed.data.Data[0]?.Id : undefined;
  return id ? ok({ value: id }) : vismaRefused({ what: "the units", response: found.value });
}

/** A family reference as article-number text: no diacritics or punctuation, `Tjänster` → `Tjanster`. */
const slugOf = ({ ref }: { ref: string }) =>
  ref
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 16);

/**
 * `BIBI-ADV25` for advances on a numeric reference, `BIBI-ADV25-Tjanster` on a family;
 * `BIBI-VAT25-3010` on the row's own account, `BIBI-VAT25-Tjanster` on its family, `BIBI-VAT25`
 * on the default.
 */
function numberOf({
  vatPercent,
  kind,
  exact,
}: Pick<ArticleInput, "vatPercent" | "kind"> & { exact: boolean }) {
  const tail = isAccountNumber({ ref: kind.account })
    ? kind.account
    : slugOf({ ref: kind.account });
  if (kind.advance) {
    return isAccountNumber({ ref: kind.account })
      ? `BIBI-ADV${vatPercent}`
      : `BIBI-ADV${vatPercent}-${tail}`;
  }
  return exact ? `BIBI-VAT${vatPercent}-${tail}` : `BIBI-VAT${vatPercent}`;
}

async function findArticle({ accessToken, number }: Authed & { number: string }) {
  const filter = encodeURIComponent(`Number eq ${odataString({ value: number })}`);
  return firstId({ accessToken, path: `/articles?$filter=${filter}`, what: "the article" });
}

/**
 * Bibi's article for a VAT rate and account, created once: Visma takes the VAT and account of a
 * row from its article's coding (ADR 0106, 0108). Revenue rows use `BIBI-VAT25-3010` when the
 * company has a coding that books to the row's account, else `BIBI-VAT25` on its default coding;
 * advance rows use `BIBI-ADV25` coded to the advances account. An article that exists is reused
 * without reading the codings, and when they cannot be read the default article still serves a
 * revenue row. // Verify against Visma sandbox
 */
export async function articleFor({
  accessToken,
  vatPercent,
  kind,
  codings,
}: ArticleInput): Promise<Result<string>> {
  const wanted = numberOf({ vatPercent, kind, exact: true });
  const existing = await findArticle({ accessToken, number: wanted });
  if (!existing.ok || existing.value) return existing as Result<string>;
  const fallbackNumber = numberOf({ vatPercent, kind, exact: false });
  const loaded = await codings();
  if (!loaded.ok) {
    if (kind.advance) return loaded;
    const fallback = await findArticle({ accessToken, number: fallbackNumber });
    return fallback.ok && fallback.value ? (fallback as Result<string>) : loaded;
  }
  const coding = codingFor({ vatPercent, kind, codings: loaded.value });
  if (!coding.ok) return coding;
  const number = coding.value.exact ? wanted : fallbackNumber;
  if (number !== wanted) {
    const found = await findArticle({ accessToken, number });
    if (!found.ok || found.value) return found as Result<string>;
  }
  const unit = await unitId({ accessToken });
  if (!unit.ok) return unit;
  const base = kind.advance ? `Bibi advance ${vatPercent} % VAT` : `Bibi ${vatPercent} % VAT`;
  const name = coding.value.exact && !kind.advance ? `${base}, account ${kind.account}` : base;
  const body = {
    Number: number,
    Name: name,
    CodingId: coding.value.id,
    UnitId: unit.value,
    IsActive: true,
  };
  return createObject({ accessToken, path: "/articles", body, what: "the article" });
}
