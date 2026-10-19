import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { creatorNameOf, loadCreatorNames } from "./creator-names";
import {
  ApiKeyIdInputSchema,
  ApiKeyListInputSchema,
  ApiKeyListOutputSchema,
  ApiKeySchema,
} from "./schema";
import { API_KEY_SELECT, parseKeyMetadata, toApiKeyDto } from "./to-api-key-dto";

export const listApiKeys = defineOperation({
  name: "apiKey.list",
  kind: "query",
  description:
    "List the organization's active API keys for the REST API: name, preset, who created it, " +
    "expiry and last use. The secret is never returned after creation. Admins only.",
  input: ApiKeyListInputSchema,
  output: ApiKeyListOutputSchema,
  permission: "apiKey:view",
  handler: async ({ input, context }) => {
    const rows = await context.db.apikey.findMany({
      where: { enabled: true },
      select: API_KEY_SELECT,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    const names = await loadCreatorNames({ context, rows });
    const items = rows.map((row) => {
      const createdBy = parseKeyMetadata({ metadata: row.metadata })?.createdBy ?? "";
      return toApiKeyDto({ row, createdByName: names.get(createdBy) ?? null });
    });
    return ok({ value: paginate({ rows: items, limit: input.limit }) });
  },
});

export const getApiKey = defineOperation({
  name: "apiKey.get",
  kind: "query",
  description:
    "Read one active API key by id (see apiKey.list): name, preset, who created it, expiry and " +
    "last use. The secret is never returned. Admins only.",
  input: ApiKeyIdInputSchema,
  output: ApiKeySchema,
  permission: "apiKey:view",
  handler: async ({ input, context }) => {
    const row = await context.db.apikey.findFirst({
      where: { id: input.id, enabled: true },
      select: API_KEY_SELECT,
    });
    if (!row) return notFound({ entity: "API key" });
    return ok({
      value: toApiKeyDto({ row, createdByName: await creatorNameOf({ context, row }) }),
    });
  },
});
