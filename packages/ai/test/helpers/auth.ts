import { getAuth, linkMcpResource } from "@bibi/auth";
import { signInByLink } from "@bibi/auth/testing";
import { getEnv } from "@bibi/config";
import { FALLBACK_TIME_ZONE } from "@bibi/core/schemas";
import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";

/** Redirect used by packages/auth's OAuth tests for the same client id (shared test database). */
const AUTH_TEST_REDIRECT = "http://localhost:3330/oauth/callback";
/** Same default as `provision:oauth` and `@bibi/auth` (assistant token minting). */
const assistantRedirectUri = () =>
  new URL("/api/assistant/oauth/callback", getEnv().WEB_URL).toString();

export type TestUser = { userId: string; organizationId: string; cookies: Headers };

/** Fresh user with a session whose active organization is a new org they own. */
export async function signUpWithOrg(): Promise<TestUser> {
  const email = `ai-${createId()}@example.test`;
  const { userId, headers: cookies } = await signInByLink({ email, name: "AI Test" });
  const slug = `org-${createId()}`;
  const org = await getAuth().api.createOrganization({
    headers: cookies,
    body: { name: slug, slug, metadata: { timeZone: FALLBACK_TIME_ZONE } },
  });
  if (!org) throw new Error("organization not created");
  return { userId, organizationId: org.id, cookies };
}

/** The first-party web client (`WEB_OAUTH_CLIENT_ID`) as `provision:oauth` creates it. */
export async function registerWebClient(): Promise<void> {
  const db = getDb();
  const clientId = getEnv().WEB_OAUTH_CLIENT_ID ?? "";
  const now = new Date();
  const redirectUris = [assistantRedirectUri(), AUTH_TEST_REDIRECT];
  const data = {
    name: clientId,
    redirectUris,
    tokenEndpointAuthMethod: "none",
    grantTypes: ["authorization_code", "refresh_token"],
    responseTypes: ["code"],
    scopes: ["openid", "profile", "email", "offline_access"],
    skipConsent: true,
    requirePKCE: true,
    updatedAt: now,
  };
  await db.oauthClient.upsert({
    where: { clientId },
    update: { redirectUris },
    create: { id: createId(), clientId, createdAt: now, ...data },
  });
  await linkMcpResource({ db, clientId });
}
