import { z } from "zod";
import { ok, type Result } from "../../errors/result";
import { conflict } from "../../shared/errors";
import { vismaCall, vismaRefused } from "./visma-request";

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
