import { ok, parseMemberRole, type Result, resolveSubjectAccess } from "@bibi/core";
import { getDb } from "@bibi/db";
import { z } from "zod";
import { getAuth } from "../get-auth";
import { forbidden, unauthenticated } from "./errors";
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
  const preset = parseMemberRole({ role: metadata.data.role });
  const access = await resolveSubjectAccess({
    ...{ db: getDb(), organizationId, subjectKind: "apiKey", subjectId: apiKeyId, preset },
  });
  const roles = preset ? [preset] : [];
  return ok({
    value: { userId: null, apiKeyId, organizationId, roles, ...access, aiAllowed: false },
  });
}
