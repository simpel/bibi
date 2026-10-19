import { applyOverrides, ok, parseMemberRole, type Result } from "@okazi/core";
import { z } from "zod";
import { getAuth } from "../get-auth";
import { forbidden, unauthenticated } from "./errors";
import { loadSubjectOverrides } from "./load-overrides";
import type { Principal } from "./principal";

const KeyMetadataSchema = z.object({ role: z.string().min(1), createdBy: z.string().min(1) });

export type FromApiKeyInput = { key: string };

/**
 * API key → organization (`referenceId`, stored as `apikey.organizationId`). The key belongs to
 * the organization, not a user (ADR 0050): it acts with its own preset (`metadata.role`) plus its
 * overrides, and keeps working when its creator leaves. A key without a valid preset grants
 * nothing. Revoked (disabled), expired and unknown keys are UNAUTHENTICATED.
 */
export async function principalFromApiKey({ key }: FromApiKeyInput): Promise<Result<Principal>> {
  const result = await getAuth().api.verifyApiKey({ body: { key } });
  if (!result.valid || !result.key) return unauthenticated({ message: "Invalid API key" });
  const metadata = KeyMetadataSchema.safeParse(result.key.metadata);
  if (!metadata.success) return forbidden({ message: "API key has no preset" });
  const organizationId = result.key.referenceId;
  const apiKeyId = result.key.id;
  const role = parseMemberRole({ role: metadata.data.role });
  const overrides = await loadSubjectOverrides({
    organizationId,
    subjectType: "API_KEY",
    subjectId: apiKeyId,
  });
  const permissions = applyOverrides({ preset: role, overrides });
  const roles = role ? [role] : [];
  return ok({
    value: { userId: null, apiKeyId, organizationId, roles, permissions, aiAllowed: false },
  });
}
