import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { DemoFieldValues } from "./config-types";
import type { TypeRef } from "./demo-refs";

export type MissingInput = { what: string };

/** The data files refer to a row that was not seeded (a bug in the data, not in the app). */
export const missing = ({ what }: MissingInput) =>
  err({
    error: new AppError({ code: "INTERNAL", message: `Demo data refers to unknown ${what}` }),
  });

export type ResolveFieldsInput = { fields: DemoFieldValues | undefined; type: TypeRef };

/** Field names → keys and value names → list value ids, as the operations expect. */
export function resolveFields({
  fields,
  type,
}: ResolveFieldsInput): Result<Record<string, unknown>> {
  const resolved: Record<string, unknown> = {};
  for (const [name, raw] of Object.entries(fields ?? {})) {
    const field = type.fields.get(name);
    if (!field) return missing({ what: `field ${name}` });
    const names = typeof raw === "string" ? [raw] : Array.isArray(raw) ? raw : null;
    const ids = names?.map((value) => field.values?.get(value) ?? value);
    resolved[field.key] = ids ? (Array.isArray(raw) ? ids : ids[0]) : raw;
  }
  return ok({ value: resolved });
}
