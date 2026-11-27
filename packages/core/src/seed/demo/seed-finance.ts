import { ok, type Result } from "../../errors/result";
import { setAccountMapping } from "../../features/finance/mapping-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { missing } from "./seed-fields";
import type { DemoOrg } from "./types";

export type SeedDemoFinanceInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0123: the item types' own revenue accounts, mapped on the connected accounting system (a
 * new connection already maps Deposits and Default revenue to the BAS accounts).
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
  for (const { type, account } of org.finance.revenueAccounts) {
    const found = types.find((row) => row.name === type);
    if (!found) return missing({ what: `item type ${type}` });
    const input = {
      purpose: "ENTITY_TYPE" as const,
      entityTypeId: found.id,
      providerAccount: account,
    };
    const saved = await execute({ operation: setAccountMapping, input, context });
    if (!saved.ok) return saved;
  }
  return ok({ value: true });
}
