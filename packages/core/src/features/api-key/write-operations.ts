import { createId } from "@paralleldrive/cuid2";
import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { checkKeyCaller, checkKeyRole } from "./check-key-role";
import { insertApiKey } from "./insert-api-key";
import { loadOwnerNames } from "./owner-names";
import {
  ApiKeyCreatedSchema,
  ApiKeyCreateInputSchema,
  ApiKeyIdInputSchema,
  ApiKeySchema,
} from "./schema";
import { API_KEY_SELECT, parseKeyMetadata, toApiKeyDto } from "./to-api-key-dto";

export const createApiKey = defineOperation({
  name: "apiKey.create",
  kind: "command",
  description:
    "Create an API key for the REST API, owned by you and acting with one fixed role (viewer, " +
    "member or admin; never owner, never above your own). The secret is returned once. Only a " +
    "signed-in web session can create keys; the assistant never can.",
  input: ApiKeyCreateInputSchema,
  output: ApiKeyCreatedSchema,
  permission: "integration:admin",
  // The secret must never enter a chat (ADR 0005, #88).
  aiAllowed: false,
  handler: async ({ input, context }) => {
    const caller = checkKeyCaller({ context });
    if (!caller.ok) return caller;
    const role = checkKeyRole({ context, role: input.role });
    if (!role.ok) return role;
    const userId = caller.value;
    const { row, secret } = await insertApiKey({ context, id: createId(), userId, ...input });
    const names = await loadOwnerNames({ context, rows: [row] });
    const apiKey = toApiKeyDto({ row, ownerName: names.get(userId) ?? null });
    // Audit gets the key without the secret (the DTO never carries it or its hash).
    context.recordChange({ entityId: apiKey.id, after: apiKey });
    return ok({ value: { apiKey, secret } });
  },
});

export const revokeApiKey = defineOperation({
  name: "apiKey.revoke",
  kind: "command",
  description: "Revoke an API key (see apiKey.list). Requests with it fail at once.",
  input: ApiKeyIdInputSchema,
  output: ApiKeySchema,
  permission: "integration:admin",
  handler: async ({ input, context }) => {
    const where = { id: input.id, enabled: true };
    const row = await context.db.apikey.findFirst({ where, select: API_KEY_SELECT });
    if (!row) return err({ error: new AppError({ code: "NOT_FOUND", message: "Key not found" }) });
    await context.db.apikey.update({
      where: { id: row.id },
      data: { enabled: false, updatedAt: new Date() },
    });
    const userId = parseKeyMetadata({ metadata: row.metadata })?.userId ?? "";
    const names = await loadOwnerNames({ context, rows: [row] });
    const apiKey = toApiKeyDto({ row, ownerName: names.get(userId) ?? null });
    context.recordChange({ entityId: apiKey.id, before: apiKey });
    return ok({ value: apiKey });
  },
});
