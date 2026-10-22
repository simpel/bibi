import { draftFromPreset } from "@bibi/core/pipeline-setup-templates";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

/** A user client and an assistant client acting for the same user in one organization. */
async function setup() {
  const userId = `user_${createId()}`;
  const base = testContext({ actor: { type: "user", userId } });
  const ai = testContext({
    organizationId: base.organizationId,
    actor: { type: "ai", userId, conversationId: "conv_first_setup" },
  });
  return {
    base,
    user: await connect({ context: base }),
    assistant: await connect({ context: ai }),
  };
}

describe("approving the first setup (ADR 0045, #311)", () => {
  it("creates nothing until approved, then sets up types and phases as one audited batch", async () => {
    const { base, user, assistant } = await setup();
    const draft = draftFromPreset({ key: "conference-estate", existingTypes: [] });
    const proposal = await call({
      client: assistant,
      name: "pipelineSetup_activate",
      args: draft,
    });
    expect(proposal.data).toMatchObject({
      status: "approval_required",
      operation: "pipelineSetup.activate",
    });
    expect(await base.db.ticketPhase.count()).toBe(0);
    expect(await base.db.auditLog.count()).toBe(0);

    const confirmed = await call({
      client: user,
      name: "approval_confirm",
      args: { approvalToken: proposal.data.approvalToken },
    });
    expect(confirmed.isError, JSON.stringify(confirmed.data)).toBe(false);

    const phases = await call({ client: user, name: "ticketPhase_list", args: {} });
    expect(phases.data.items.map((row: { name: string }) => row.name)).toEqual(
      draft.phases.map((phase) => phase.name),
    );
    const types = await call({ client: user, name: "entityType_list", args: {} });
    const names = types.data.items.map((row: { name: string }) => row.name);
    for (const type of draft.itemTypes) expect(names).toContain(type.name);

    const rows = await base.db.auditLog.findMany();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row).toMatchObject({
        actorType: "AI",
        actorId: base.actor.userId,
        approvedBy: base.actor.userId,
        conversationId: "conv_first_setup",
      });
    }
    expect(rows.map((row) => row.operation)).toContain("pipelineSetup.activate");
  });
});
