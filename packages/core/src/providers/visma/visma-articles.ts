import { z } from "zod";
import { ok, type Result } from "../../errors/result";
import { conflict } from "../../shared/errors";
import { createObject, firstId, paged } from "./visma-lookups";
import { odataString, vismaCall, vismaRefused } from "./visma-request";

type Authed = { accessToken: string };

const accountNumber = z.coerce.number().nullish();

/** An account coding: its VAT rate (0.25) and the sales accounts it posts to. */
const CodingsSchema = paged({
  item: z.object({
    Id: z.string(),
    VatRatePercent: z.coerce.number().nullish(),
    IsActive: z.boolean().nullish(),
    DomesticSalesSubjectToVatAccountNumber: accountNumber,
    DomesticSalesVatExemptAccountNumber: accountNumber,
  }),
});
type Coding = z.infer<typeof CodingsSchema>["Data"][number];

const UnitsSchema = paged({ item: z.object({ Id: z.string() }) });

/**
 * What a row is booked as (ADR 0106): revenue, or a customer advance on `account` (a prepayment
 * invoice's rows and a deducted deposit, ADR 0093).
 */
export type RowKind = { advance: false } | { advance: true; account: number };

type ArticleInput = Authed & { vatPercent: number; kind: RowKind };

const salesAccountOf = ({ coding }: { coding: Coding }) =>
  (coding.VatRatePercent ?? 0) === 0
    ? coding.DomesticSalesVatExemptAccountNumber
    : coding.DomesticSalesSubjectToVatAccountNumber;

/** A balance sheet account (BAS classes 1 and 2): never a revenue coding. */
const onBalanceSheet = ({ account }: { account: number | null | undefined }) =>
  account !== null && account !== undefined && account < 3000;

const advanceMissing = ({ vatPercent, account }: { vatPercent: number; account: number }) =>
  `Visma has no ${vatPercent} % VAT account coding that books sales to ${account}. Create one ` +
  `in Visma (Settings → Account codings) so prepayments and their deductions land on customer ` +
  "advances, then send again.";

/**
 * The coding for a row (ADR 0106): an advance takes the active coding at the rate that books to
 * the advances account; revenue the first one at the rate that does not book to the balance
 * sheet. // Verify against Visma sandbox
 */
async function codingFor({ accessToken, vatPercent, kind }: ArticleInput): Promise<Result<string>> {
  const found = await vismaCall({ path: "/articleaccountcodings", accessToken });
  if (!found.ok) return found;
  const parsed = CodingsSchema.safeParse(found.value.json);
  if (found.value.status !== 200 || !parsed.success) {
    return vismaRefused({ what: "the account codings", response: found.value });
  }
  const atRate = parsed.data.Data.filter(
    (c) => c.IsActive !== false && Math.round((c.VatRatePercent ?? -1) * 100) === vatPercent,
  );
  const match = kind.advance
    ? atRate.find((coding) => salesAccountOf({ coding }) === kind.account)
    : atRate.find((coding) => !onBalanceSheet({ account: salesAccountOf({ coding }) }));
  if (match) return ok({ value: match.Id });
  const message = kind.advance
    ? advanceMissing({ vatPercent, account: kind.account })
    : `Visma has no ${vatPercent} % VAT coding`;
  return conflict({ message });
}

async function unitId({ accessToken }: Authed): Promise<Result<string>> {
  const found = await vismaCall({ path: "/units", accessToken });
  if (!found.ok) return found;
  const parsed = UnitsSchema.safeParse(found.value.json);
  const id = parsed.success ? parsed.data.Data[0]?.Id : undefined;
  return id ? ok({ value: id }) : vismaRefused({ what: "the units", response: found.value });
}

/**
 * Bibi's article for a VAT rate, created once: Visma takes the VAT and account of a row from its
 * article's coding. Revenue rows use `BIBI-VAT25`, advance rows `BIBI-ADV25` coded to the
 * advances account (ADR 0106). // Verify against Visma sandbox
 */
export async function articleFor({
  accessToken,
  vatPercent,
  kind,
}: ArticleInput): Promise<Result<string>> {
  const number = kind.advance ? `BIBI-ADV${vatPercent}` : `BIBI-VAT${vatPercent}`;
  const filter = encodeURIComponent(`Number eq ${odataString({ value: number })}`);
  const what = "the article";
  const found = await firstId({ accessToken, path: `/articles?$filter=${filter}`, what });
  if (!found.ok || found.value) return found as Result<string>;
  const coding = await codingFor({ accessToken, vatPercent, kind });
  if (!coding.ok) return coding;
  const unit = await unitId({ accessToken });
  if (!unit.ok) return unit;
  const name = kind.advance ? `Bibi advance ${vatPercent} % VAT` : `Bibi ${vatPercent} % VAT`;
  const body = {
    Number: number,
    Name: name,
    CodingId: coding.value,
    UnitId: unit.value,
    IsActive: true,
  };
  return createObject({ accessToken, path: "/articles", body, what });
}
