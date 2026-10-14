import type { AddressInfo } from "node:net";
import { createExecuteContext, ok } from "@okazi/core";
import { type CapturedLogs, captureLogs } from "@okazi/logger";
import { createId } from "@paralleldrive/cuid2";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createHttpServer } from "../src/http/create-http-server";
import { fakeEmbed } from "./fake-embed";

const organizationId = `org_${createId()}`;

async function resolveContext() {
  const actor = { type: "user" as const, userId: `user_${organizationId}` };
  return ok({ value: createExecuteContext({ organizationId, roles: ["owner"], actor }) });
}

const server = createHttpServer({
  resolveContext,
  embed: fakeEmbed,
  baseUrl: "http://localhost:3001",
  authorizationServer: "http://localhost:3000/api/auth",
  allowedOrigins: ["http://localhost:3000"],
});
let url = "";
let logs: CapturedLogs;

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
beforeEach(() => {
  logs = captureLogs();
});
afterEach(() => logs.restore());

const CALL = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: { name: "venue_list", arguments: {} },
};

describe("MCP request logging (ADR 0014)", () => {
  it("one request id from the HTTP line through the tool call to the operation", async () => {
    const response = await fetch(`${url}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "x-request-id": "chat-run-00042",
      },
      body: JSON.stringify(CALL),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("chat-run-00042");
    const expected = { requestId: "chat-run-00042", surface: "mcp" };
    expect(logs.events({ event: "http.request" })[0]).toMatchObject({ ...expected, status: 200 });
    expect(logs.events({ event: "mcp.toolCalled" })[0]).toMatchObject({
      ...expected,
      tool: "venue_list",
      outcome: "ok",
    });
    expect(logs.events({ event: "operation.completed" })[0]).toMatchObject({
      ...expected,
      operation: "venue.list",
    });
  });
});
