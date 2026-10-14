import { getDb } from "@okazi/db";

export type IsGrantRevokedInput = {
  organizationId: string;
  userId: string;
  clientId: string;
  /** Token `iat` in seconds. */
  issuedAt: number;
};

/**
 * True when core `oauthGrant.revoke` cut off this user's client in the organization after the
 * token was issued. Access tokens are stateless JWTs, so this check is what makes revocation
 * immediate instead of waiting for the 15-minute expiry.
 */
export async function isGrantRevoked({
  organizationId,
  userId,
  clientId,
  issuedAt,
}: IsGrantRevokedInput): Promise<boolean> {
  const revocation = await getDb().oauthGrantRevocation.findUnique({
    where: { organizationId_userId_clientId: { organizationId, userId, clientId } },
    select: { revokedAt: true },
  });
  return revocation !== null && issuedAt * 1000 <= revocation.revokedAt.getTime();
}
