import type { AddressInfo } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { appError, createExecuteContext, err, grantAll, ok } from "@okazi/core";
import { createId } from "@paralleldrive/cuid2";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHttpServer } from "../src/http/create-http-server";
import { fakeEmbed } from "./fake-embed";

type ResolveInput = { headers: Headers };

/** Test auth: `x-test-org` selects the org; missing -> 401; `x-test-forbidden` -> 403. */
async function resolveContext({ headers }: ResolveInput) {
  const organizationId = headers.get("x-test-org");
  if (!organizationId) {
    return err({ error: appError({ code: "UNAUTHENTICATED", message: "Sign in required" }) });
  }
  if (headers.has("x-test-forbidden")) {
    return err({ error: appError({ code: "FORBIDDEN", message: "No access" }) });
  }
  const actor = { type: "user" as const, userId: `user_${organizationId}` };
  return ok({
    value: createExecuteContext({
      organizationId,
      roles: ["owner"],
      permissions: grantAll({ upTo: "admin" }),
      actor,
    }),
  });
}

const server = createHttpServer({
  resolveContext,
  embed: fakeEmbed,
  baseUrl: "http://localhost:3001",
  authorizationServer: "http://localhost:3000/api/auth",
  allowedOrigins: ["http://localhost:3000"],
});
let url = "";

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

const LIST = { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} };
const JSON_HEADERS = {
  "content-type": "application/json",
  accept: "application/json, text/event-stream",
};

describe("HTTP transport", () => {
  it("answers 401 with a WWW-Authenticate pointing at the protected-resource metadata", async () => {
    const response = await fetch(`${url}/mcp`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(LIST),
    });
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toBe(
      'Bearer resource_metadata="http://localhost:3001/.well-known/oauth-protected-resource"',
    );
  });

  it("answers 403 without a challenge when the caller is known but not allowed", async () => {
    const headers = { ...JSON_HEADERS, "x-test-org": "org_x", "x-test-forbidden": "1" };
    const response = await fetch(`${url}/mcp`, {
      method: "POST",
      headers,
      body: JSON.stringify(LIST),
    });
    expect(response.status).toBe(403);
    expect(response.headers.get("www-authenticate")).toBeNull();
  });

  it("serves RFC 9728 protected-resource metadata without credentials", async () => {
    const response = await fetch(`${url}/.well-known/oauth-protected-resource`);
    expect(await response.json()).toMatchObject({
      resource: "http://localhost:3001/mcp",
      authorization_servers: ["http://localhost:3000/api/auth"],
    });
  });

  it("lists and calls tools through the SDK client with a valid resolver", async () => {
    const organizationId = `org_${createId()}`;
    const transport = new StreamableHTTPClientTransport(new URL(`${url}/mcp`), {
      requestInit: { headers: { "x-test-org": organizationId } },
    });
    const client = new Client({ name: "http-test", version: "0.0.0" });
    await client.connect(transport);
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toContain("venue_create");
    const created = await client.callTool({
      name: "venue_create",
      arguments: { name: "Over HTTP" },
    });
    expect(created.structuredContent).toMatchObject({ name: "Over HTTP", organizationId });
    await client.close();
  });

  it("rejects other browser origins, allows the web origin, and only POSTs on /mcp", async () => {
    const evil = await fetch(`${url}/mcp`, {
      method: "POST",
      headers: { ...JSON_HEADERS, origin: "http://evil.test" },
    });
    expect(evil.status).toBe(403);
    const preflight = await fetch(`${url}/mcp`, {
      method: "OPTIONS",
      headers: { origin: "http://localhost:3000" },
    });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
    expect((await fetch(`${url}/mcp`)).status).toBe(405);
    expect((await fetch(`${url}/nope`)).status).toBe(404);
  });
});
