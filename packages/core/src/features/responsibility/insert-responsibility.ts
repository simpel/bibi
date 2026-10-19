import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { checkResponsibilityContents } from "./check-contents";
import { findResponsibility, replaceResponsibilityLinks } from "./responsibility-rows";
import type { ResponsibilityCreateInput, ResponsibilityDto } from "./schema";

export type InsertResponsibilityInput = { context: OperationContext } & ResponsibilityCreateInput;

/**
 * Shared by `responsibility.create` and `configuration.importTemplate`: unique name, validated
 * types and people, insert, record.
 */
export async function insertResponsibility({
  context,
  name,
  ...given
}: InsertResponsibilityInput): Promise<Result<ResponsibilityDto>> {
  if (await context.db.responsibility.findFirst({ where: { name } })) {
    return conflict({ message: `A responsibility named "${name}" exists` });
  }
  const contents = await checkResponsibilityContents({ context, contents: given });
  if (!contents.ok) return contents;
  const { entityTypeIds, defaultFollowerIds, ...scalars } = contents.value;
  const { id } = await context.db.responsibility.create({
    data: { name, ...scalars, organizationId: context.organizationId },
  });
  await replaceResponsibilityLinks({ context, responsibilityId: id, contents: contents.value });
  const after = await findResponsibility({ context, id });
  if (!after) return notFound({ entity: "Responsibility" });
  context.recordChange({ entityId: id, after });
  return ok({ value: after });
}
