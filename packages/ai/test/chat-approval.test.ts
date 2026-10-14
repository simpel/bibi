import { resolveExecuteContext } from "@okazi/auth";
import { getDb } from "@okazi/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApprovalHandler } from "../src/approval/create-approval-handler";
import { extractPendingApprovals } from "../src/approval/extract-pending-approvals";
import { createEmbed } from "../src/embeddings/create-embed";
import { registerWebClient, signUpWithOrg, type TestUser } from "./helpers/auth";
import { chatRequest, createHarness, readChunks } from "./helpers/chat";
import { storedMessages } from "./helpers/db";
import { type RunningMcp, startMcpServer } from "./helpers/mcp-server";
import { mockModel, textStep, toolStep } from "./helpers/mock-model";

let mcp: RunningMcp;

beforeAll(async () => {
  await registerWebClient();
  mcp = await startMcpServer();
});
afterAll(() => mcp.close());

const approvalHandler = () =>
  createApprovalHandler({
    resolveContext: resolveExecuteContext,
    mcpUrl: mcp.url,
    embed: createEmbed(),
  });

type DecideInput = { user: TestUser; body: Record<string, unknown> };

const decide = ({ user, body }: DecideInput) =>
  approvalHandler()(
    new Request("http://localhost:3000/api/assistant/approval", {
      method: "POST",
      headers: { cookie: user.cookies.get("cookie") ?? "", "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

/** One run where the model proposes `venue_create`, then explains. */
async function propose({ user, name }: { user: TestUser; name: string }) {
  const model = mockModel({
    steps: [
      toolStep({ toolName: "venue_create", input: { name } }),
      textStep({ text: "Förslag klart." }),
    ],
  });
  const { handler } = createHarness({ model, mcpUrl: mcp.url });
  const response = await handler(chatRequest({ cookies: user.cookies, text: `Skapa ${name}` }));
  const conversationId = response.headers.get("x-okazi-conversation-id") ?? "";
  const chunks = await readChunks({ response });
  const rows = await storedMessages({ conversationId, minCount: 2 });
  const assistant = rows.find((row) => row.role === "ASSISTANT");
  const approvals = extractPendingApprovals({
    message: { parts: (assistant?.parts ?? []) as unknown[] },
  });
  return { conversationId, chunks, approvals };
}

describe("approval flow through the chat handler", () => {
  it("proposes without executing, then the user's approval creates the venue (audit AI + approvedBy)", async () => {
    const user = await signUpWithOrg();
    const { conversationId, chunks, approvals } = await propose({ user, name: "Aulan" });
    const output = chunks.find((chunk) => chunk.type === "tool-output-available")?.output;
    expect(output?.structuredContent).toMatchObject({
      status: "approval_required",
      operation: "venue.create",
    });
    expect(await getDb().venue.count({ where: { organizationId: user.organizationId } })).toBe(0);
    expect(approvals).toHaveLength(1);
    expect(approvals[0]).toMatchObject({
      toolCallId: "call_venue_create",
      toolName: "venue_create",
      operation: "venue.create",
      input: { name: "Aulan" },
      summary: 'Create venue "Aulan"',
    });

    const body = {
      decision: "approve",
      approvalToken: approvals[0]?.approvalToken,
      conversationId,
      toolCallId: "call_venue_create",
      operation: "venue.create",
    };
    const response = await decide({ user, body });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "approved",
      result: { name: "Aulan", status: "ACTIVE" },
    });
    const venues = await getDb().venue.findMany({ where: { organizationId: user.organizationId } });
    expect(venues.map((venue) => venue.name)).toEqual(["Aulan"]);
    const audit = await getDb().auditLog.findFirst({
      where: { operation: "venue.create", organizationId: user.organizationId },
    });
    expect(audit).toMatchObject({
      actorType: "AI",
      actorId: user.userId,
      approvedBy: user.userId,
      conversationId,
    });
    const rows = await storedMessages({ conversationId, minCount: 3 });
    expect(rows.at(-1)).toMatchObject({ role: "TOOL", actorType: "USER" });
    expect(JSON.stringify(rows.at(-1)?.parts)).toContain("APPROVED venue.create");

    const replay = await decide({ user, body });
    expect(replay.status).toBe(409);
  });

  it("records a rejection and executes nothing", async () => {
    const user = await signUpWithOrg();
    const { conversationId, approvals } = await propose({ user, name: "Nej-salen" });
    const body = {
      decision: "reject",
      approvalToken: approvals[0]?.approvalToken,
      conversationId,
      operation: "venue.create",
    };
    const response = await decide({ user, body });
    expect(await response.json()).toEqual({ status: "rejected" });
    expect(await getDb().venue.count({ where: { organizationId: user.organizationId } })).toBe(0);
    const rows = await storedMessages({ conversationId, minCount: 3 });
    expect(JSON.stringify(rows.at(-1)?.parts)).toContain("REJECTED venue.create");
  });

  it("refuses another user's approval token and unauthenticated callers", async () => {
    const owner = await signUpWithOrg();
    const { approvals } = await propose({ user: owner, name: "Inte din" });
    const other = await signUpWithOrg();
    const stolen = await decide({
      user: other,
      body: { decision: "approve", approvalToken: approvals[0]?.approvalToken },
    });
    expect(stolen.status).toBe(403);
    const anonymous = await approvalHandler()(
      new Request("http://localhost/approval", {
        method: "POST",
        body: JSON.stringify({ decision: "reject", approvalToken: "x" }),
      }),
    );
    expect(anonymous.status).toBe(401);
    expect(await getDb().venue.count({ where: { organizationId: owner.organizationId } })).toBe(0);
  });
});
