import type { RevokeOauthGrantInput, WithDb } from "./types";

/**
 * Revokes the user's refresh and stored access tokens for one client in one organization and
 * removes the consent, so the client must ask again. Stateless JWT access tokens are cut off by
 * `OauthGrantRevocation` (checked in packages/auth). Returns how many rows were affected.
 */
export async function revokeOauthGrant({
  db,
  organizationId,
  userId,
  clientId,
}: WithDb<RevokeOauthGrantInput>): Promise<number> {
  const where = { userId, clientId, referenceId: organizationId };
  const revoked = new Date();
  const [refresh, access, consents] = await Promise.all([
    db.oauthRefreshToken.updateMany({ where: { ...where, revoked: null }, data: { revoked } }),
    db.oauthAccessToken.updateMany({ where: { ...where, revoked: null }, data: { revoked } }),
    db.oauthConsent.deleteMany({ where }),
  ]);
  return refresh.count + access.count + consents.count;
}
