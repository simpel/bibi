import { getEnv } from "@okazi/config";
import { getDb } from "@okazi/db";
import { createId } from "@paralleldrive/cuid2";
import { beforeAll, describe, expect, it } from "vitest";
import { clientAllowsAiActor } from "../src/first-party/clients";
import { clearTokenCache } from "../src/first-party/token-cache";
import { getFirstPartyAccessToken, mcpResourceUrl, resolveExecuteContext } from "../src/index";
import { codeOf, createOrg, signUp } from "./helpers";
import { obtainAccessToken, registerClient } from "./oauth-flow";

const AI_HEADERS = { "x-okazi-actor": "ai", "x-okazi-conversation-id": "conv_assistant" };

/** The first-party client as `provision:oauth` creates it (assistant redirect URI added). */
async function registerWebClient(): Promise<void> {
  const db = getDb();
  const clientId = getEnv().WEB_OAUTH_CLIENT_ID ?? "";
  const redirectUris = [
    new URL("/api/assistant/oauth/callback", getEnv().WEB_URL).toString(),
    "http://localhost:3000/oauth/callback",
  ];
  const now = new Date();
  await db.oauthClient.upsert({
    where: { clientId },
    update: { redirectUris },
    create: {
      id: createId(),
      clientId,
      name: clientId,
      redirectUris,
      tokenEndpointAuthMethod: "none",
      grantTypes: ["authorization_code", "refresh_token"],
      responseTypes: ["code"],
      scopes: ["openid", "profile", "email", "offline_access"],
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
}

const bearer = ({ token, extra = {} }: { token: string; extra?: Record<string, string> }) =>
  new Headers({ authorization: `Bearer ${token}`, ...extra });

beforeAll(registerWebClient);

describe("getFirstPartyAccessToken (assistant)", () => {
  it("mints a web-client token for the session user + active org that may act as AI", async () => {
    clearTokenCache();
    const user = await signUp();
    const organizationId = await createOrg({ headers: user.headers });
    const caller = { userId: user.userId, organizationId };
    const token = await getFirstPartyAccessToken({
      client: "assistant",
      headers: user.headers,
      caller,
    });
    if (!token.ok) throw token.error;
    const ai = await resolveExecuteContext({
      headers: bearer({ token: token.value, extra: AI_HEADERS }),
    });
    if (!ai.ok) throw ai.error;
    expect(ai.value.organizationId).toBe(organizationId);
    expect(ai.value.actor).toEqual({
      type: "ai",
      userId: user.userId,
      conversationId: "conv_assistant",
    });
    const plain = await resolveExecuteContext({ headers: bearer({ token: token.value }) });
    if (!plain.ok) throw plain.error;
    expect(plain.value.actor).toEqual({ type: "user", userId: user.userId });
  });

  it("reuses the cached token for the same user and org", async () => {
    clearTokenCache();
    const user = await signUp();
    const organizationId = await createOrg({ headers: user.headers });
    const caller = { userId: user.userId, organizationId };
    const first = await getFirstPartyAccessToken({
      client: "assistant",
      headers: user.headers,
      caller,
    });
    const second = await getFirstPartyAccessToken({
      client: "assistant",
      headers: new Headers(),
      caller,
    });
    expect(first.ok && second.ok && first.value === second.value).toBe(true);
  });

  it("fails UNAUTHENTICATED without a valid session cookie", async () => {
    clearTokenCache();
    const caller = { userId: `user_${createId()}`, organizationId: `org_${createId()}` };
    const none = await getFirstPartyAccessToken({
      client: "assistant",
      headers: new Headers(),
      caller,
    });
    expect(codeOf({ result: none })).toBe("UNAUTHENTICATED");
    const forged = new Headers({ cookie: "better-auth.session_token=forged" });
    expect(
      codeOf({
        result: await getFirstPartyAccessToken({ client: "assistant", headers: forged, caller }),
      }),
    ).toBe("UNAUTHENTICATED");
  });
});

describe("AI actor is a property of the first-party client", () => {
  it("is allowed only for registry clients flagged allowsAiActor", () => {
    expect(clientAllowsAiActor({ clientId: getEnv().WEB_OAUTH_CLIENT_ID ?? "" })).toBe(true);
    expect(clientAllowsAiActor({ clientId: `client_${createId()}` })).toBe(false);
  });

  it("rejects the AI actor for a token issued to a non-assistant client", async () => {
    const user = await signUp();
    await createOrg({ headers: user.headers });
    const clientId = await registerClient({});
    const token = await obtainAccessToken({ clientId, cookies: user.headers });
    const result = await resolveExecuteContext({ headers: bearer({ token, extra: AI_HEADERS }) });
    expect(codeOf({ result })).toBe("FORBIDDEN");
  });
});
