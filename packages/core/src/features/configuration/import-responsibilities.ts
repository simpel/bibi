import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import type { ConfigurationTemplate } from "../../templates/configuration/configuration-template";
import { insertResponsibility } from "../responsibility/insert-responsibility";
import type { ResponsibilityDto } from "../responsibility/schema";
import { withEntityType } from "./with-entity-type";

export type ImportResponsibilitiesInput = {
  context: OperationContext;
  template: ConfigurationTemplate;
};

export type ImportedResponsibilities = { created: ResponsibilityDto[]; skipped: string[] };

/** The importing user, when they are a member: the example responsibilities default to them. */
async function importingMember({ context }: { context: OperationContext }) {
  const { userId } = context.actor;
  if (!userId) return null;
  return context.db.member.findFirst({ where: { userId }, select: { userId: true } });
}

/**
 * Creates the template's responsibilities that do not exist yet, covering the item types of
 * those names. The importing member is the default assignee (ADR 0034: it must be a member), so
 * nothing is created for callers who are not members, e.g. SYSTEM. Existing names are kept.
 */
export async function importResponsibilities({
  context,
  template,
}: ImportResponsibilitiesInput): Promise<Result<ImportedResponsibilities>> {
  const imported: ImportedResponsibilities = { created: [], skipped: [] };
  const member = await importingMember({ context });
  if (!member) return ok({ value: imported });
  const audited = withEntityType({ context, entityType: "responsibility" });
  for (const { name, types } of template.responsibilities) {
    if (await context.db.responsibility.findFirst({ where: { name } })) {
      imported.skipped.push(name);
      continue;
    }
    const rows = await context.db.entityType.findMany({
      where: { base: "ITEM", name: { in: [...types] } },
      select: { id: true },
    });
    const created = await insertResponsibility({
      context: audited,
      name,
      entityTypeIds: rows.map((row) => row.id),
      defaultAssigneeId: member.userId,
      defaultFollowerIds: [],
    });
    if (!created.ok) return created;
    imported.created.push(created.value);
  }
  return ok({ value: imported });
}
