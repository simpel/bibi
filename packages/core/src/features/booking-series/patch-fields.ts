import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { mergeFields, validateFields } from "../field-definition/field-values";

type FieldValues = Record<string, unknown>;

export type PatchFieldsInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  entityTypeId: string;
  before: FieldValues;
  patch: FieldValues | undefined;
};

/** `fields` merged by key with the patch (null clears) and validated against the type. */
export async function patchFields({
  context,
  entityTypeId,
  before,
  patch,
}: PatchFieldsInput): Promise<Result<FieldValues>> {
  if (!patch) return ok({ value: before });
  const values = mergeFields({ before, patch });
  return validateFields({ context, entityTypeId, values });
}
