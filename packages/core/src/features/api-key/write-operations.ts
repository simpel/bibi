import { createId } from "@paralleldrive/cuid2";
import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { checkKeyCaller } from "./check-key-caller";
import { creatorNameOf } from "./creator-names";
import { insertApiKey } from "./insert-api-key";
import {
  ApiKeyCreatedSchema,
  ApiKeyCreateInputSchema,
  ApiKeyIdInputSchema,
  ApiKeySchema,
  ApiKeyUpdateInputSchema,
} from "./schema";
import { API_KEY_SELECT, parseKeyMetadata, toApiKeyDto } from "./to-api-key-dto";

export const createApiKey = defineOperation({
  name: "apiKey.create",
  kind: "command",
  description:
    "Create an API key for the REST API. It belongs to the organization and acts with a preset " +
    "(member, manager or admin), fine-tuned with permission.update. The secret is returned " +
    "once. Admins only, from a signed-in web session; the assistant never can.",
  input: ApiKeyCreateInputSchema,
  output: ApiKeyCreatedSchema,
  permission: "apiKey:create",
  // The secret must never enter a chat (ADR 0005, #88).
  aiAllowed: false,
  handler: async ({ input, context }) => {
    const caller = checkKeyCaller({ context });
    if (!caller.ok) return caller;
    const userId = caller.value;
    const { row, secret } = await insertApiKey({ context, id: createId(), userId, ...input });
    const apiKey = toApiKeyDto({ row, createdByName: await creatorNameOf({ context, row }) });
    // Audit gets the key without the secret (the DTO never carries it or its hash).
    context.recordChange({ entityId: apiKey.id, after: apiKey });
    return ok({ value: { apiKey, secret } });
  },
});

export const updateApiKey = defineOperation({
  name: "apiKey.update",
  kind: "command",
  description:
    "Rename an API key or change its preset (member, manager or admin). Its overrides stay " +
    "(see permission.update). Admins only.",
  input: ApiKeyUpdateInputSchema,
  output: ApiKeySchema,
  permission: "apiKey:edit",
  handler: async ({ input, context }) => {
    const where = { id: input.id, enabled: true };
    const row = await context.db.apikey.findFirst({ where, select: API_KEY_SELECT });
    if (!row) return notFound({ entity: "API key" });
    const createdByName = await creatorNameOf({ context, row });
    const metadata = parseKeyMetadata({ metadata: row.metadata });
    const role = input.role ?? metadata?.role ?? "";
    const createdBy = metadata?.createdBy ?? "";
    const updated = await context.db.apikey.update({
      where: { id: row.id },
      data: {
        name: input.name ?? row.name,
        metadata: JSON.stringify({ role, createdBy }),
        updatedAt: new Date(),
      },
      select: API_KEY_SELECT,
    });
    const before = toApiKeyDto({ row, createdByName });
    const after = toApiKeyDto({ row: updated, createdByName });
    context.recordChange({ entityId: row.id, before, after });
    return ok({ value: after });
  },
});

export const revokeApiKey = defineOperation({
  name: "apiKey.revoke",
  kind: "command",
  description: "Revoke an API key (see apiKey.list). Requests with it fail at once. Admins only.",
  input: ApiKeyIdInputSchema,
  output: ApiKeySchema,
  permission: "apiKey:remove",
  handler: async ({ input, context }) => {
    const where = { id: input.id, enabled: true };
    const row = await context.db.apikey.findFirst({ where, select: API_KEY_SELECT });
    if (!row) return notFound({ entity: "API key" });
    await context.db.apikey.update({
      where: { id: row.id },
      data: { enabled: false, updatedAt: new Date() },
    });
    const apiKey = toApiKeyDto({ row, createdByName: await creatorNameOf({ context, row }) });
    context.recordChange({ entityId: apiKey.id, before: apiKey });
    return ok({ value: apiKey });
  },
});
