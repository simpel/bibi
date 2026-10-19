import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { loadFieldSpecs } from "./field-specs";
import { buildFieldsSchema } from "./fields-schema";
import { checkLinkValues } from "./link-rules";
import { type CheckedFields, splitLinks } from "./split-links";

type FieldValues = Record<string, unknown>;

export type MergeFieldsInput = { before: FieldValues; patch: FieldValues };

/** `*.update` semantics for `fields`: changed keys replace, `null` removes, the rest is kept. */
export function mergeFields({ before, patch }: MergeFieldsInput): FieldValues {
  const merged: FieldValues = { ...before, ...patch };
  for (const [key, value] of Object.entries(patch)) if (value === null) delete merged[key];
  return merged;
}

export type ValidateFieldsInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  entityTypeId: string;
  values: FieldValues;
};

/**
 * Validates `fields` against the Zod schema built from the type's field definitions, then that
 * LINK values are active records of the target type in the organization. Issues get
 * `fields.<key>` paths so forms can show them next to the right field. The valid values come back
 * split for storage: scalars as `fields` JSON, `LINK` values as `RecordLink` rows (ADR 0056).
 */
export async function validateFields({
  context,
  entityTypeId,
  values,
}: ValidateFieldsInput): Promise<Result<CheckedFields>> {
  const specs = await loadFieldSpecs({ context, entityTypeId });
  const parsed = buildFieldsSchema({ specs }).safeParse(values);
  if (parsed.success) {
    const links = await checkLinkValues({ context, specs, values: parsed.data });
    return links.ok ? ok({ value: splitLinks({ specs, values: parsed.data }) }) : links;
  }
  const issues = parsed.error.issues.flatMap((issue) => {
    const keys = issue.code === "unrecognized_keys" ? issue.keys : [issue.path.join(".")];
    return keys.map((key) => ({ path: `fields.${key}`, message: issue.message }));
  });
  return invalid({ message: "Invalid field values", issues });
}
