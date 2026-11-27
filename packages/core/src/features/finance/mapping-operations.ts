import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { conflict, invalid } from "../../shared/errors";
import { loadLedgerConnection, loadMappingList } from "./load-mappings";
import {
  AccountMappingListInputSchema,
  AccountMappingListSchema,
  AccountMappingSetInputSchema,
} from "./mapping-schema";

export const listAccountMappings = defineOperation({
  name: "accountMapping.list",
  entityType: "accountMapping",
  kind: "query",
  description:
    "Read what Bibi books to in the connected accounting system: Deposits (ADVANCES), Default " +
    "revenue (REVENUE_DEFAULT) and the account of each item type that has its own (ENTITY_TYPE). " +
    "An item type without a mapping uses Default revenue. Empty when no accounting system is connected.",
  input: AccountMappingListInputSchema,
  output: AccountMappingListSchema,
  permission: "finance:read",
  handler: async ({ context }) => {
    const connection = await loadLedgerConnection({ context });
    return ok({ value: await loadMappingList({ context, connection }) });
  },
});

export const setAccountMapping = defineOperation({
  name: "accountMapping.set",
  entityType: "accountMapping",
  kind: "command",
  description:
    "Map one purpose to an account of the connected accounting system, or remove the mapping with " +
    "providerAccount null. Several purposes may use the same account. Deposits and Default revenue " +
    "must be mapped before invoices or deposits can be sent; other item types fall back to Default " +
    "revenue. providerAccount is the system's own reference from its account list (Fortnox: the " +
    "account number; Spiris: a coding family such as Tjänster).",
  input: AccountMappingSetInputSchema,
  output: AccountMappingListSchema,
  permission: "finance:write",
  handler: async ({ input, context }) => {
    const connection = await loadLedgerConnection({ context });
    if (!connection) {
      return conflict({
        message: "Connect an accounting system first (Administration → Integrations).",
      });
    }
    const { purpose, entityTypeId, providerAccount } = input;
    if (entityTypeId) {
      const known = await context.db.entityType.count({
        where: { id: entityTypeId, base: "ITEM" },
      });
      if (known === 0) return invalid({ message: "The item type does not exist" });
    }
    const before = await loadMappingList({ context, connection });
    const existing = await context.db.accountMapping.findFirst({
      where: { connectionId: connection.id, purpose, entityTypeId },
      select: { id: true },
    });
    if (providerAccount === null) {
      if (existing) await context.db.accountMapping.delete({ where: { id: existing.id } });
    } else if (existing) {
      await context.db.accountMapping.update({
        where: { id: existing.id },
        data: { providerAccount },
      });
    } else {
      await context.db.accountMapping.create({
        data: {
          organizationId: context.organizationId,
          connectionId: connection.id,
          purpose,
          entityTypeId,
          providerAccount,
        },
      });
    }
    const after = await loadMappingList({ context, connection });
    context.recordChange({ entityId: connection.id, before, after });
    return ok({ value: after });
  },
});
