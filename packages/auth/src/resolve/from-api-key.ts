import { ok, type Result } from "@okazi/core";
import { z } from "zod";
import { getAuth } from "../get-auth";
import { capRole, highestRole, roleForKeyPermissions } from "../roles";
import { forbidden, unauthenticated } from "./errors";
import { loadMemberRoles } from "./membership";
import type { Principal } from "./principal";

const KeyMetadataSchema = z.object({ organizationId: z.string().min(1) });

export type FromApiKeyInput = { key: string };

/**
 * API key → owner (`referenceId`) + `metadata.organizationId`. Effective role is the owner's
 * live membership role capped by the key's permissions, so a key never outranks its owner.
 */
export async function principalFromApiKey({ key }: FromApiKeyInput): Promise<Result<Principal>> {
  const result = await getAuth().api.verifyApiKey({ body: { key } });
  if (!result.valid || !result.key) return unauthenticated({ message: "Invalid API key" });
  const metadata = KeyMetadataSchema.safeParse(result.key.metadata);
  if (!metadata.success) return forbidden({ message: "API key is not bound to an organization" });
  const userId = result.key.referenceId;
  const { organizationId } = metadata.data;
  const memberRole = highestRole({ roles: await loadMemberRoles({ userId, organizationId }) });
  const keyRole = roleForKeyPermissions({ permissions: result.key.permissions });
  const roles = memberRole && keyRole ? [capRole({ role: memberRole, cap: keyRole })] : [];
  return ok({ value: { userId, organizationId, roles, aiAllowed: false } });
}
