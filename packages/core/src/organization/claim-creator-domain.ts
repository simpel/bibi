import type { Db } from "@bibi/db";
import { ok, type Result } from "../errors/result";
import { setOrganizationDomainJoin } from "../features/organization-profile/domain-join-operation";
import { createExecuteContext } from "../operations/context";
import { execute } from "../operations/execute";
import { grantAll } from "../permissions/permission-set";
import { emailDomainOf } from "./email-domain";

/** Who created the organization, as Better Auth's `afterCreateOrganization` passes them. */
export type OrganizationCreator = { userId: string; email: string; emailVerified: boolean };

export type ClaimCreatorDomainInput = {
  organizationId: string;
  creator: OrganizationCreator;
  db?: Db;
};

/**
 * Domain join starts on with the creator's own domain (ADR 0076), run as the creator (already the
 * admin here) so the audit row says who claimed it. An unverified or public address claims
 * nothing: the switch stays on with no domain until an admin with a work email turns it on.
 */
export async function claimCreatorDomain({
  organizationId,
  creator,
  db,
}: ClaimCreatorDomainInput): Promise<Result<true>> {
  if (!creator.emailVerified || !emailDomainOf({ email: creator.email }))
    return ok({ value: true });
  const context = createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({}),
    actor: { type: "user", userId: creator.userId },
    ...(db ? { db } : {}),
  });
  const input = { enabled: true };
  const claimed = await execute({ operation: setOrganizationDomainJoin, input, context });
  return claimed.ok ? ok({ value: true }) : claimed;
}
