import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { ExecuteContext } from "../../operations/context";
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

export type ResolveLinksInput = {
  context: ExecuteContext;
  values: Record<string, unknown>;
  type: TypeRef;
};

/** `LINK` values by record name → the id of the record of the target type with that name. */
export async function resolveLinks({
  context,
  values,
  type,
}: ResolveLinksInput): Promise<Result<Record<string, unknown>>> {
  const resolved = { ...values };
  for (const { key, linkTypeId } of type.fields.values()) {
    const name = values[key];
    if (!linkTypeId || typeof name !== "string") continue;
    const where = { entityTypeId: linkTypeId, name };
    const found =
      (await context.db.contact.findFirst({ where })) ??
      (await context.db.customer.findFirst({ where })) ??
      (await context.db.item.findFirst({ where }));
    if (!found) return missing({ what: `linked record ${name}` });
    resolved[key] = found.id;
  }
  return ok({ value: resolved });
}

export type ResolveDemoFieldsInput = ResolveFieldsInput & { context: ExecuteContext };

/** `resolveFields`, then `resolveLinks`: the values a record's operation expects. */
export async function resolveDemoFields({ context, fields, type }: ResolveDemoFieldsInput) {
  const resolved = resolveFields({ fields, type });
  return resolved.ok ? resolveLinks({ context, values: resolved.value, type }) : resolved;
}
