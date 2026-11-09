import { z } from "zod";
import { ok, type Result } from "../../errors/result";
import { conflict } from "../../shared/errors";
import { odataString, vismaCall, vismaRefused } from "./visma-request";

type Authed = { accessToken: string };

/** A paged eAccounting list: `{ Meta, Data: [...] }`. */
export const paged = <T extends z.ZodType>({ item }: { item: T }) =>
  z.object({ Data: z.array(item).default([]) });

const IdSchema = z.object({ Id: z.string().min(1) });

export type ListFirstInput = Authed & { path: string; what: string };

/** The first item's id of a filtered list, or null when none matches. */
export async function firstId({
  accessToken,
  path,
  what,
}: ListFirstInput): Promise<Result<string | null>> {
  const found = await vismaCall({ path, accessToken });
  if (!found.ok) return found;
  const parsed = paged({ item: IdSchema }).safeParse(found.value.json);
  if (found.value.status !== 200 || !parsed.success)
    return vismaRefused({ what, response: found.value });
  return ok({ value: parsed.data.Data[0]?.Id ?? null });
}

export type CreateInput = Authed & { path: string; body: unknown; what: string };

/** POSTs a new object and returns its id (201). */
export async function createObject({
  accessToken,
  path,
  body,
  what,
}: CreateInput): Promise<Result<string>> {
  const sent = await vismaCall({ method: "POST", path, accessToken, body });
  if (!sent.ok) return sent;
  const parsed = IdSchema.safeParse(sent.value.json);
  if (sent.value.status !== 201 || !parsed.success)
    return vismaRefused({ what, response: sent.value });
  return ok({ value: parsed.data.Id });
}

const TermsSchema = paged({
  item: z.object({ Id: z.string(), NumberOfDays: z.coerce.number().nullish() }),
});

/** Payment terms for a new customer: the ones closest to 30 days. // Verify against Visma sandbox */
export async function defaultTermsId({ accessToken }: Authed): Promise<Result<string>> {
  const found = await vismaCall({ path: "/termsofpayments", accessToken });
  if (!found.ok) return found;
  const parsed = TermsSchema.safeParse(found.value.json);
  if (found.value.status !== 200 || !parsed.success) {
    return vismaRefused({ what: "the payment terms", response: found.value });
  }
  const terms = [...parsed.data.Data].sort(
    (a, b) => Math.abs((a.NumberOfDays ?? 0) - 30) - Math.abs((b.NumberOfDays ?? 0) - 30),
  );
  const id = terms[0]?.Id;
  return id ? ok({ value: id }) : conflict({ message: "Visma has no payment terms set up" });
}

const CodingsSchema = paged({
  item: z.object({
    Id: z.string(),
    VatRatePercent: z.coerce.number().nullish(),
    IsActive: z.boolean().nullish(),
  }),
});
const UnitsSchema = paged({ item: z.object({ Id: z.string() }) });

type VatInput = Authed & { vatPercent: number };

/** The account coding with the VAT rate (Visma stores it as 0.25). // Verify against Visma sandbox */
async function codingFor({ accessToken, vatPercent }: VatInput): Promise<Result<string>> {
  const found = await vismaCall({ path: "/articleaccountcodings", accessToken });
  if (!found.ok) return found;
  const parsed = CodingsSchema.safeParse(found.value.json);
  if (found.value.status !== 200 || !parsed.success) {
    return vismaRefused({ what: "the account codings", response: found.value });
  }
  const match = parsed.data.Data.find(
    (c) => c.IsActive !== false && Math.round((c.VatRatePercent ?? -1) * 100) === vatPercent,
  );
  return match
    ? ok({ value: match.Id })
    : conflict({ message: `Visma has no ${vatPercent} % VAT coding` });
}

async function unitId({ accessToken }: Authed): Promise<Result<string>> {
  const found = await vismaCall({ path: "/units", accessToken });
  if (!found.ok) return found;
  const parsed = UnitsSchema.safeParse(found.value.json);
  const id = parsed.success ? parsed.data.Data[0]?.Id : undefined;
  return id ? ok({ value: id }) : vismaRefused({ what: "the units", response: found.value });
}

/**
 * Bibi's article for a VAT rate (`BIBI-VAT25`), created once: Visma takes the VAT and revenue
 * account of a row from its article's coding. // Verify against Visma sandbox
 */
export async function articleFor({ accessToken, vatPercent }: VatInput): Promise<Result<string>> {
  const number = `BIBI-VAT${vatPercent}`;
  const filter = encodeURIComponent(`Number eq ${odataString({ value: number })}`);
  const what = "the article";
  const found = await firstId({ accessToken, path: `/articles?$filter=${filter}`, what });
  if (!found.ok || found.value) return found as Result<string>;
  const coding = await codingFor({ accessToken, vatPercent });
  if (!coding.ok) return coding;
  const unit = await unitId({ accessToken });
  if (!unit.ok) return unit;
  const body = {
    Number: number,
    Name: `Bibi ${vatPercent} % VAT`,
    CodingId: coding.value,
    UnitId: unit.value,
    IsActive: true,
  };
  return createObject({ accessToken, path: "/articles", body, what });
}
