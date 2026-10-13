import { getAuth, mcpResourceUrl } from "@okazi/auth";
import { getEnv } from "@okazi/config";
import { getDb } from "@okazi/db";
import { createId } from "@paralleldrive/cuid2";

const PASSWORD = "correct-horse-battery";
/** Redirect used by packages/auth's OAuth tests for the same client id (shared test database). */
const AUTH_TEST_REDIRECT = "http://localhost:3000/oauth/callback";
/** Same default as `provision:oauth` and `@okazi/auth` (assistant token minting). */
const assistantRedirectUri = () =>
  new URL("/api/assistant/oauth/callback", getEnv().WEB_URL).toString();

export type TestUser = { userId: string; organizationId: string; cookies: Headers };

const cookieHeaders = ({ response }: { response: Headers }): Headers => {
  const cookie = response
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  return new Headers({ cookie });
};

/** Fresh user with a session whose active organization is a new org they own. */
export async function signUpWithOrg(): Promise<TestUser> {
  const email = `ai-${createId()}@example.test`;
  const { headers, response } = await getAuth().api.signUpEmail({
    body: { email, password: PASSWORD, name: "AI Test" },
    returnHeaders: true,
  });
  const cookies = cookieHeaders({ response: headers });
  const slug = `org-${createId()}`;
  const org = await getAuth().api.createOrganization({ headers: cookies, body: { name: slug, slug } });
  if (!org) throw new Error("organization not created");
  return { userId: response.user.id, organizationId: org.id, cookies };
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
  const resourceId = mcpResourceUrl();
  await db.oauthClientResource.upsert({
    where: { clientId_resourceId: { clientId, resourceId } },
    update: {},
    create: { id: createId(), clientId, resourceId, createdAt: now },
  });
}
