import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { loadOwnerNames } from "./owner-names";
import { ApiKeyListInputSchema, ApiKeyListOutputSchema } from "./schema";
import { API_KEY_SELECT, parseKeyMetadata, toApiKeyDto } from "./to-api-key-dto";

export const listApiKeys = defineOperation({
  name: "apiKey.list",
  kind: "query",
  description:
    "List the organization's active API keys for the REST API: name, role, owner, expiry and " +
    "last use. The secret is never returned after creation.",
  input: ApiKeyListInputSchema,
  output: ApiKeyListOutputSchema,
  permission: "integration:admin",
  handler: async ({ input, context }) => {
    const rows = await context.db.apikey.findMany({
      where: { enabled: true },
      select: API_KEY_SELECT,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    const names = await loadOwnerNames({ context, rows });
    const items = rows.map((row) => {
      const userId = parseKeyMetadata({ metadata: row.metadata })?.userId ?? "";
      return toApiKeyDto({ row, ownerName: names.get(userId) ?? null });
    });
    return ok({ value: paginate({ rows: items, limit: input.limit }) });
  },
});
