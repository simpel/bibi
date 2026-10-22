import { describe, expect, it } from "vitest";
import { resolveExecuteContext } from "../src/index";
import { codeOf, createOrg, signIn, signUp, withHeaders } from "./helpers";

describe("resolveExecuteContext – session cookie", () => {
  it("rejects requests without credentials", async () => {
    const result = await resolveExecuteContext({ headers: new Headers() });
    expect(codeOf({ result })).toBe("UNAUTHENTICATED");
  });

  it("rejects a forged session cookie", async () => {
    const headers = new Headers({ cookie: "better-auth.session_token=forged.value" });
    expect(codeOf({ result: await resolveExecuteContext({ headers }) })).toBe("UNAUTHENTICATED");
  });

  it("is FORBIDDEN while the user has no organization", async () => {
    const user = await signUp();
    expect(codeOf({ result: await resolveExecuteContext({ headers: user.headers }) })).toBe(
      "FORBIDDEN",
    );
  });

  it("resolves the active organization and owner role", async () => {
    const user = await signUp();
    const organizationId = await createOrg({ headers: user.headers });
    const result = await resolveExecuteContext({ headers: user.headers });
    if (!result.ok) throw result.error;
    expect(result.value.organizationId).toBe(organizationId);
    expect(result.value.roles).toEqual(["admin"]);
    expect(result.value.actor).toEqual({ type: "user", userId: user.userId });
  });

  it("starts new sessions in the user's organization", async () => {
    const user = await signUp();
    const organizationId = await createOrg({ headers: user.headers });
    const headers = await signIn({ email: user.email });
    const result = await resolveExecuteContext({ headers });
    expect(result.ok && result.value.organizationId).toBe(organizationId);
  });

  it("refuses the AI actor header on cookie sessions", async () => {
    const user = await signUp();
    await createOrg({ headers: user.headers });
    const headers = withHeaders({
      headers: user.headers,
      extra: { "x-bibi-actor": "ai", "x-bibi-conversation-id": "conv_1" },
    });
    expect(codeOf({ result: await resolveExecuteContext({ headers }) })).toBe("FORBIDDEN");
  });
});
