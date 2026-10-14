import type { ListOauthGrantsInput, OauthGrantRow, WithDb } from "./types";

type GrantSource = { clientId: string; scopes: string[]; createdAt: Date };

const merge = ({ sources }: { sources: GrantSource[] }) => {
  const byClient = new Map<string, { scopes: Set<string>; connectedAt: Date }>();
  for (const { clientId, scopes, createdAt } of sources) {
    const grant = byClient.get(clientId) ?? { scopes: new Set<string>(), connectedAt: createdAt };
    for (const scope of scopes) grant.scopes.add(scope);
    if (createdAt < grant.connectedAt) grant.connectedAt = createdAt;
    byClient.set(clientId, grant);
  }
  return byClient;
};

/**
 * The user's OAuth grants in one organization (Better Auth `referenceId` = the organization
 * granted at consent): live refresh tokens and consents, one row per client.
 */
export async function listOauthGrants({
  db,
  organizationId,
  userId,
}: WithDb<ListOauthGrantsInput>): Promise<OauthGrantRow[]> {
  const where = { userId, referenceId: organizationId };
  const select = { clientId: true, scopes: true, createdAt: true } as const;
  const [refresh, consents] = await Promise.all([
    db.oauthRefreshToken.findMany({
      where: { ...where, revoked: null, expiresAt: { gt: new Date() } },
      select,
    }),
    db.oauthConsent.findMany({ where, select }),
  ]);
  const byClient = merge({ sources: [...refresh, ...consents] });
  const clients = await db.oauthClient.findMany({
    where: { clientId: { in: [...byClient.keys()] } },
    select: { clientId: true, name: true },
  });
  const names = new Map(clients.map((client) => [client.clientId, client.name]));
  return [...byClient.entries()]
    .map(([clientId, grant]) => ({
      clientId,
      clientName: names.get(clientId) ?? null,
      scopes: [...grant.scopes].sort(),
      connectedAt: grant.connectedAt,
    }))
    .sort((a, b) => b.connectedAt.getTime() - a.connectedAt.getTime());
}
