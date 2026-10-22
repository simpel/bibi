import { execute, listOauthGrants, revokeOauthGrant } from "@bibi/core";
import { describe, expect, it } from "vitest";
import { resolveExecuteContext } from "../src/index";
import { codeOf, createOrg, signUp } from "./helpers";
import { obtainAccessToken, registerClient } from "./oauth-flow";

const bearer = ({ token }: { token: string }) => new Headers({ authorization: `Bearer ${token}` });

const sessionContext = async ({ headers }: { headers: Headers }) => {
  const context = await resolveExecuteContext({ headers });
  if (!context.ok) throw context.error;
  return context.value;
};

describe("oauthGrant.revoke – MCP access tokens", () => {
  it("lists the connected client and rejects its tokens once revoked", async () => {
    const user = await signUp();
    await createOrg({ headers: user.headers });
    const clientId = await registerClient({});
    const token = await obtainAccessToken({ clientId, cookies: user.headers });
    expect(codeOf({ result: await resolveExecuteContext({ headers: bearer({ token }) }) })).toBe(
      "OK",
    );
    const context = await sessionContext({ headers: user.headers });
    const list = await execute({ operation: listOauthGrants, input: {}, context });
    if (!list.ok) throw list.error;
    expect(list.value.items.map((grant) => grant.clientId)).toEqual([clientId]);
    const revoked = await execute({ operation: revokeOauthGrant, input: { clientId }, context });
    expect(codeOf({ result: revoked })).toBe("OK");
    const after = await resolveExecuteContext({ headers: bearer({ token }) });
    expect(codeOf({ result: after })).toBe("UNAUTHENTICATED");
  });

  it("leaves other clients of the same user working", async () => {
    const user = await signUp();
    await createOrg({ headers: user.headers });
    const revokedClient = await registerClient({});
    const keptClient = await registerClient({});
    await obtainAccessToken({ clientId: revokedClient, cookies: user.headers });
    const kept = await obtainAccessToken({ clientId: keptClient, cookies: user.headers });
    const context = await sessionContext({ headers: user.headers });
    await execute({ operation: revokeOauthGrant, input: { clientId: revokedClient }, context });
    const result = await resolveExecuteContext({ headers: bearer({ token: kept }) });
    expect(codeOf({ result })).toBe("OK");
  });
});
