import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { loadAccountingSettings } from "./load-settings";
import type {
  AccountingSettingsDto,
  AccountingSettingsUpdateInput,
  RevenueAccountDto,
} from "./settings-schema";

type Context = Pick<OperationContext, "db" | "organizationId" | "recordChange">;

/** Every mapped item type is an active item type and every item an active item of this organization. */
async function checkTargets({
  context,
  rows,
}: {
  context: Context;
  rows: readonly RevenueAccountDto[];
}) {
  const typeIds = rows.flatMap((row) => (row.entityTypeId ? [row.entityTypeId] : []));
  const itemIds = rows.flatMap((row) => (row.itemId ? [row.itemId] : []));
  const [types, items] = await Promise.all([
    context.db.entityType.count({ where: { id: { in: typeIds }, base: "ITEM" } }),
    context.db.item.count({ where: { id: { in: itemIds } } }),
  ]);
  const unique = ({ ids }: { ids: string[] }) => new Set(ids).size === ids.length;
  if (!unique({ ids: typeIds }) || !unique({ ids: itemIds })) {
    return invalid({ message: "An item type or item is mapped twice" });
  }
  if (types !== typeIds.length || items !== itemIds.length) {
    return invalid({ message: "An item type or item does not exist" });
  }
  return ok({ value: true });
}

export type SaveSettingsInput = { context: Context; data: AccountingSettingsUpdateInput };

/** Creates or changes the settings row and, when given, replaces the revenue account set. */
export async function saveAccountingSettings({
  context,
  data,
}: SaveSettingsInput): Promise<Result<AccountingSettingsDto>> {
  const { revenueAccounts, ...fixed } = data;
  if (revenueAccounts) {
    const checked = await checkTargets({ context, rows: revenueAccounts });
    if (!checked.ok) return checked;
  }
  const before = await loadAccountingSettings({ context });
  const row = await context.db.accountingSettings.upsert({
    where: { organizationId: context.organizationId },
    create: { ...fixed, organizationId: context.organizationId },
    update: fixed,
    select: { id: true },
  });
  if (revenueAccounts) {
    await context.db.revenueAccount.deleteMany({});
    await context.db.revenueAccount.createMany({
      data: revenueAccounts.map((mapping) => ({
        ...mapping,
        organizationId: context.organizationId,
      })),
    });
  }
  const after = await loadAccountingSettings({ context });
  context.recordChange({ entityId: row.id, before, after });
  return ok({ value: after });
}
