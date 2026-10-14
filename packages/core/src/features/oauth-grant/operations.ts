import type { OauthGrantRow } from "@okazi/db";
import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import {
  type OauthGrantDto,
  OauthGrantListInputSchema,
  OauthGrantListOutputSchema,
  OauthGrantRevokeInputSchema,
  OauthGrantSchema,
} from "./schema";

const toDto = ({ row }: { row: OauthGrantRow }): OauthGrantDto => ({
  id: row.clientId,
  clientId: row.clientId,
  name: row.clientName ?? row.clientId,
  scopes: row.scopes,
  connectedAt: row.connectedAt,
});

const fail = ({ code, message }: { code: "NOT_FOUND" | "FORBIDDEN"; message: string }) =>
  err({ error: new AppError({ code, message }) });

export const listOauthGrants = defineOperation({
  name: "oauthGrant.list",
  kind: "query",
  description:
    "List the OAuth/MCP clients you have connected to this organization (your own only).",
  input: OauthGrantListInputSchema,
  output: OauthGrantListOutputSchema,
  permission: "integration:read",
  // Client names come from dynamic client registration, i.e. from third parties.
  untrustedOutput: true,
  handler: async ({ context }) => {
    const userId = context.actor.userId;
    if (!userId) return ok({ value: { items: [], nextCursor: null } });
    const rows = await context.db.$listOauthGrants({ userId });
    return ok({ value: { items: rows.map((row) => toDto({ row })), nextCursor: null } });
  },
});

export const revokeOauthGrant = defineOperation({
  name: "oauthGrant.revoke",
  kind: "command",
  description:
    "Disconnect one of your OAuth/MCP clients (see oauthGrant.list): its tokens stop working " +
    "at once and it has to ask for access again.",
  input: OauthGrantRevokeInputSchema,
  output: OauthGrantSchema,
  permission: "integration:write",
  untrustedOutput: true,
  handler: async ({ input, context }) => {
    const userId = context.actor.userId;
    if (!userId) return fail({ code: "FORBIDDEN", message: "Only a user has OAuth grants" });
    const rows = await context.db.$listOauthGrants({ userId });
    const row = rows.find((grant) => grant.clientId === input.clientId);
    if (!row) return fail({ code: "NOT_FOUND", message: "Connected client not found" });
    const { organizationId } = context;
    const revokedAt = new Date();
    await context.db.oauthGrantRevocation.upsert({
      where: { organizationId_userId_clientId: { organizationId, userId, ...input } },
      create: { organizationId, userId, clientId: input.clientId, revokedAt, createdBy: userId },
      update: { revokedAt },
    });
    await context.db.$revokeOauthGrant({ userId, clientId: input.clientId });
    const grant = toDto({ row });
    context.recordChange({ entityId: grant.clientId, before: grant });
    return ok({ value: grant });
  },
});

export const oauthGrantOperations = [listOauthGrants, revokeOauthGrant];
