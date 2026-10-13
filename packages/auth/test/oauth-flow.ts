import { createHash, randomBytes } from "node:crypto";
import { getEnv } from "@okazi/config";
import { getDb } from "@okazi/db";
import { createId } from "@paralleldrive/cuid2";
import { getAuth, mcpResourceUrl } from "../src/index";
import { OAUTH_SCOPES } from "../src/plugins/mcp";

const REDIRECT_URI = "http://localhost:3000/oauth/callback";

export type RegisterClientInput = { clientId?: string };

/** Public PKCE client linked to the MCP resource, consent skipped (first-party style). */
export async function registerClient({ clientId = `client_${createId()}` }: RegisterClientInput) {
  const db = getDb();
  const now = new Date();
  await db.oauthClient.upsert({
    where: { clientId },
    update: {},
    create: {
      id: createId(),
      clientId,
      name: clientId,
      redirectUris: [REDIRECT_URI],
      tokenEndpointAuthMethod: "none",
      grantTypes: ["authorization_code", "refresh_token"],
      responseTypes: ["code"],
      scopes: OAUTH_SCOPES,
      skipConsent: true,
      requirePKCE: true,
      createdAt: now,
      updatedAt: now,
    },
  });
  const resourceId = mcpResourceUrl();
  await db.oauthClientResource.upsert({
    where: { clientId_resourceId: { clientId, resourceId } },
    update: {},
    create: { id: createId(), clientId, resourceId, createdAt: now },
  });
  return clientId;
}

const authUrl = ({ path }: { path: string }) => `${getEnv().BETTER_AUTH_URL}/api/auth${path}`;

export type AuthorizeInput = { clientId: string; cookies: Headers; challenge: string };

const authorize = async ({ clientId, cookies, challenge }: AuthorizeInput): Promise<string> => {
  const query = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    scope: "openid offline_access",
    state: createId(),
    code_challenge: challenge,
    code_challenge_method: "S256",
    resource: mcpResourceUrl(),
  });
  const response = await getAuth().handler(
    new Request(authUrl({ path: `/oauth2/authorize?${query}` }), { headers: cookies }),
  );
  const location = response.headers.get("location") ?? (await response.text());
  const code = new URL(location, REDIRECT_URI).searchParams.get("code");
  if (!code) throw new Error(`authorize did not return a code: ${response.status} ${location}`);
  return code;
};

export type ObtainTokenInput = { clientId: string; cookies: Headers };

/** Full authorization-code + PKCE flow through the real Better Auth handler. */
export async function obtainAccessToken({ clientId, cookies }: ObtainTokenInput): Promise<string> {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const code = await authorize({ clientId, cookies, challenge });
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: clientId,
    code_verifier: verifier,
    resource: mcpResourceUrl(),
  });
  const response = await getAuth().handler(
    new Request(authUrl({ path: "/oauth2/token" }), { method: "POST", body }),
  );
  const json = (await response.json()) as { access_token?: string };
  if (!json.access_token) throw new Error(`token failed: ${JSON.stringify(json)}`);
  return json.access_token;
}
