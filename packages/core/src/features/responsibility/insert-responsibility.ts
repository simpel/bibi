import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { checkResponsibilityContents } from "./check-contents";
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
  const row = await context.db.responsibility.create({
    data: { name, ...contents.value, organizationId: context.organizationId },
  });
  context.recordChange({ entityId: row.id, after: row });
  return ok({ value: row });
}
