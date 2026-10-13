import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { call, connect, type Json, testContext } from "./helpers";

type AiSetup = { organizationId?: string };

async function setup({ organizationId }: AiSetup = {}) {
  const userId = `user_${createId()}`;
  const base = testContext({
    actor: { type: "user", userId },
    ...(organizationId ? { organizationId } : {}),
  });
  const ai = testContext({
    organizationId: base.organizationId,
    actor: { type: "ai", userId, conversationId: "conv_42" },
  });
  return {
    base,
    user: await connect({ context: base }),
    assistant: await connect({ context: ai }),
  };
}

describe("approval flow", () => {
  it("proposes for the AI actor, executes only after approval_confirm by the user", async () => {
    const { base, user, assistant } = await setup();
    const proposal = await call({
      client: assistant,
      name: "venue_create",
      args: { name: "Proposed" },
    });
    expect(proposal.isError).toBe(false);
    expect(proposal.data).toMatchObject({
      status: "approval_required",
      operation: "venue.create",
      input: { name: "Proposed" },
      summary: 'Create venue "Proposed"',
    });
    expect(typeof proposal.data.approvalToken).toBe("string");
    expect(await base.db.venue.count()).toBe(0);
    expect(await base.db.auditLog.count()).toBe(0);

    const confirmed = await call({
      client: user,
      name: "approval_confirm",
      args: { approvalToken: proposal.data.approvalToken },
    });
    expect(confirmed.isError).toBe(false);
    expect(confirmed.data).toMatchObject({ name: "Proposed", status: "ACTIVE" });
    expect(await base.db.venue.count()).toBe(1);
    const rows = await base.db.auditLog.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      operation: "venue.create",
      actorType: "AI",
      actorId: base.actor.userId,
      conversationId: "conv_42",
    });
  });

  it("lets the AI actor read without approval", async () => {
    const { assistant } = await setup();
    const list = await call({ client: assistant, name: "venue_list" });
    expect(list.data).toEqual({ items: [], nextCursor: null });
  });

  it("does not ask approval for input or permissions that would fail", async () => {
    const { assistant } = await setup();
    const invalid = await call({ client: assistant, name: "venue_create", args: { name: "" } });
    expect(invalid.data.code).toBe("VALIDATION");
  });

  it("rejects replays, tampered tokens and the AI actor confirming", async () => {
    const { user, assistant } = await setup();
    const proposal = await call({
      client: assistant,
      name: "venue_create",
      args: { name: "Once" },
    });
    const token: string = proposal.data.approvalToken;
    const aiConfirm = await call({
      client: assistant,
      name: "approval_confirm",
      args: { approvalToken: token },
    });
    expect(aiConfirm.isError).toBe(true);
    const [body = "", signature = ""] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({
        ...JSON.parse(Buffer.from(body, "base64url").toString()),
        input: { name: "Evil" },
      }),
    ).toString("base64url");
    for (const bad of [`${forged}.${signature}`, `${body}.AAAA`, "garbage", ""]) {
      const result = await call({
        client: user,
        name: "approval_confirm",
        args: { approvalToken: bad },
      });
      expect(result.isError).toBe(true);
    }
    const first = await call({
      client: user,
      name: "approval_confirm",
      args: { approvalToken: token },
    });
    expect(first.isError).toBe(false);
    const replay: Json = await call({
      client: user,
      name: "approval_confirm",
      args: { approvalToken: token },
    });
    expect(replay).toMatchObject({ isError: true, data: { code: "CONFLICT" } });
  });

  it("binds the token to the confirming user and organization", async () => {
    const { assistant } = await setup();
    const proposal = await call({
      client: assistant,
      name: "venue_create",
      args: { name: "Bound" },
    });
    const approvalToken = proposal.data.approvalToken;
    const stranger = await connect({ context: testContext() });
    const result = await call({
      client: stranger,
      name: "approval_confirm",
      args: { approvalToken },
    });
    expect(result).toMatchObject({ isError: true, data: { code: "FORBIDDEN" } });
  });
});
