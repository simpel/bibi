import { ok, type Result } from "../../errors/result";
import { createAccountingExport } from "../../features/finance/export-operations";
import { updateAccountingSettings } from "../../features/finance/settings-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { demoExportRange } from "./finance-range";
import { missing } from "./seed-fields";
import type { DemoOrg } from "./types";

export type SeedDemoFinanceInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0077: the organization's revenue accounts per item type (BAS defaults otherwise) and its
 * first SIE export (the last 12 months) of the invoices and payments seeded with the orders.
 */
export async function seedDemoFinance({
  context,
  org,
}: SeedDemoFinanceInput): Promise<Result<true>> {
  if (!org.finance) return ok({ value: true });
  const types = await context.db.entityType.findMany({
    where: { base: "ITEM" },
    select: { id: true, name: true },
  });
  const revenueAccounts = [];
  for (const { type, account } of org.finance.revenueAccounts) {
    const found = types.find((row) => row.name === type);
    if (!found) return missing({ what: `item type ${type}` });
    revenueAccounts.push({ entityTypeId: found.id, itemId: null, account });
  }
  const input = { revenueAccounts };
  const saved = await execute({ operation: updateAccountingSettings, input, context });
  if (!saved.ok) return saved;
  const exported = await execute({
    operation: createAccountingExport,
    input: demoExportRange(),
    context,
  });
  return exported.ok ? ok({ value: true }) : exported;
}
