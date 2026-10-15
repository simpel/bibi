import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { type FieldKind, isLinkableBase } from "./field-kinds";
import { countRecordsOfType } from "./field-usage";
import type { FieldSpec } from "./fields-schema";

type Db = Pick<OperationContext, "db">;

export type CheckLinkTargetInput = {
  context: Db;
  source: { kind: FieldKind; linkTypeId: string | null };
};

/**
 * A LINK field needs a target type (`linkTypeId`) whose records can be linked: an active item,
 * customer, contact or booking type of the organization. Other kinds take no target.
 */
export async function checkLinkTarget({
  context,
  source: { kind, linkTypeId },
}: CheckLinkTargetInput): Promise<Result<true>> {
  const fail = ({ message }: { message: string }) =>
    invalid({ message, issues: [{ path: "linkTypeId", message }] });
  if (kind !== "LINK")
    return linkTypeId
      ? fail({ message: `A ${kind} field has no link target` })
      : ok({ value: true });
  if (!linkTypeId) return fail({ message: "A LINK field needs a target type (linkTypeId)" });
  const type = await context.db.entityType.findFirst({ where: { id: linkTypeId } });
  if (!type) return fail({ message: "Unknown type" });
  if (!isLinkableBase({ base: type.base }))
    return fail({ message: `${type.base} records cannot be linked` });
  return ok({ value: true });
}

export type LinkedRecordExistsInput = { context: Db; linkTypeId: string; id: string };

/**
 * True when `id` is an active record of the type. The org-scoped client hides other
 * organizations' and archived rows, so a foreign or archived id is not found.
 */
export async function linkedRecordExists({
  context,
  linkTypeId,
  id,
}: LinkedRecordExistsInput): Promise<boolean> {
  return (await countRecordsOfType({ context, entityTypeId: linkTypeId, id })) > 0;
}

export type CheckLinkValuesInput = {
  context: Db;
  specs: readonly FieldSpec[];
  values: Record<string, unknown>;
};

/** Every LINK value must be an active record of the field's target type, in the organization. */
export async function checkLinkValues({
  context,
  specs,
  values,
}: CheckLinkValuesInput): Promise<Result<true>> {
  const issues: { path: string; message: string }[] = [];
  for (const spec of specs) {
    const id = values[spec.key];
    if (spec.kind !== "LINK" || typeof id !== "string") continue;
    const found = spec.linkTypeId
      ? await linkedRecordExists({ context, linkTypeId: spec.linkTypeId, id })
      : false;
    if (!found)
      issues.push({ path: `fields.${spec.key}`, message: `Not a record of ${spec.name}` });
  }
  return issues.length > 0
    ? invalid({ message: "Invalid field values", issues })
    : ok({ value: true });
}
