import { getEnv } from "@okazi/config";
import { describe, expect, it } from "vitest";
import { resolveExecuteContext } from "../src/index";
import { codeOf, createOrg, signUp } from "./helpers";
import { obtainAccessToken, registerClient } from "./oauth-flow";

const AI_HEADERS = { "x-okazi-actor": "ai", "x-okazi-conversation-id": "conv_123" };

const bearer = ({ token, extra = {} }: { token: string; extra?: Record<string, string> }) =>
  new Headers({ authorization: `Bearer ${token}`, ...extra });

const setup = async ({ clientId }: { clientId?: string }) => {
  const user = await signUp();
  const organizationId = await createOrg({ headers: user.headers });
  const client = await registerClient({ ...(clientId ? { clientId } : {}) });
  const token = await obtainAccessToken({ clientId: client, cookies: user.headers });
  return { user, organizationId, token };
};

describe("resolveExecuteContext – OAuth access tokens (MCP)", () => {
  it("resolves user and the organization granted at consent", async () => {
    const { user, organizationId, token } = await setup({});
    const result = await resolveExecuteContext({ headers: bearer({ token }) });
    if (!result.ok) throw result.error;
    expect(result.value.organizationId).toBe(organizationId);
    expect(result.value.roles).toEqual(["owner"]);
    expect(result.value.actor).toEqual({ type: "user", userId: user.userId });
  });

  it("accepts the AI actor only for the web app's client", async () => {
    const web = await setup({ clientId: getEnv().WEB_OAUTH_CLIENT_ID });
    const ai = await resolveExecuteContext({ headers: bearer({ token: web.token, extra: AI_HEADERS }) });
    if (!ai.ok) throw ai.error;
    expect(ai.value.actor).toEqual({ type: "ai", userId: web.user.userId, conversationId: "conv_123" });
    const other = await setup({});
    const denied = await resolveExecuteContext({ headers: bearer({ token: other.token, extra: AI_HEADERS }) });
    expect(codeOf({ result: denied })).toBe("FORBIDDEN");
  });

  it("requires a conversation id for AI requests", async () => {
    const web = await setup({ clientId: getEnv().WEB_OAUTH_CLIENT_ID });
    const headers = bearer({ token: web.token, extra: { "x-okazi-actor": "ai" } });
    expect(codeOf({ result: await resolveExecuteContext({ headers }) })).toBe("FORBIDDEN");
  });

  it("rejects tampered and foreign tokens", async () => {
    const { token } = await setup({});
    const [header, payload] = token.split(".");
    const tampered = `${header}.${payload}.${"A".repeat(86)}`;
    expect(codeOf({ result: await resolveExecuteContext({ headers: bearer({ token: tampered }) }) })).toBe(
      "UNAUTHENTICATED",
    );
    const opaque = await resolveExecuteContext({ headers: bearer({ token: "not-a-jwt" }) });
    expect(codeOf({ result: opaque })).toBe("UNAUTHENTICATED");
  });
});
