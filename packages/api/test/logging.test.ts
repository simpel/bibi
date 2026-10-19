import { createExecuteContext, grantAll } from "@okazi/core";
import { type CapturedLogs, captureLogs } from "@okazi/logger";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handler, newOrgId } from "./helpers";

let logs: CapturedLogs;

beforeEach(() => {
  logs = captureLogs();
});

afterEach(() => logs.restore());

type PostInput = { org: string; requestId?: string };

function postVenue({ org, requestId }: PostInput): Promise<Response> {
  const headers = new Headers({ "content-type": "application/json", "x-test-org": org });
  if (requestId) headers.set("x-request-id", requestId);
  const body = JSON.stringify({ name: "Logged" });
  return handler(new Request("http://localhost/api/v1/venues", { method: "POST", headers, body }));
}

describe("REST request logging (ADR 0014)", () => {
  it("correlates the http line, the operation line and the audit row by request id", async () => {
    const org = newOrgId();
    const response = await postVenue({ org, requestId: "client-req-0001" });
    expect(response.status).toBe(201);
    expect(response.headers.get("x-request-id")).toBe("client-req-0001");
    const [http] = logs.events({ event: "http.request" });
    expect(http).toMatchObject({
      surface: "rest",
      requestId: "client-req-0001",
      method: "POST",
      path: "/api/v1/venues",
      status: 201,
    });
    const [operation] = logs.events({ event: "operation.completed" });
    expect(operation).toMatchObject({ requestId: "client-req-0001", operation: "venue.create" });
    const actor = { type: "user" as const, userId: `user_${org}` };
    const { db } = createExecuteContext({
      organizationId: org,
      roles: ["admin"],
      permissions: grantAll({}),
      actor,
    });
    const [row] = await db.auditLog.findMany();
    expect(row).toMatchObject({ requestId: "client-req-0001", surface: "rest" });
  });

  it("issues a request id when the caller sends none, and logs 4xx as warn", async () => {
    const response = await handler(new Request("http://localhost/api/v1/venues"));
    expect(response.status).toBe(401);
    expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
    const [http] = logs.events({ event: "http.request" });
    expect(http).toMatchObject({ level: "warn", status: 401 });
  });
});
