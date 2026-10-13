import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { createVenue, execute, listVenues, updateVenue } from "../src/index";
import { testContext, unwrap } from "./helpers";

describe("audit log", () => {
  it("writes one row per command with actor, conversation and before/after", async () => {
    const userId = `user_${createId()}`;
    const user = testContext({ actor: { type: "user", userId } });
    const ai = testContext({
      organizationId: user.organizationId,
      actor: { type: "ai", userId, conversationId: "conv_1" },
    });
    const venue = unwrap({
      result: await execute({ operation: createVenue, input: { name: "Before" }, context: user }),
    });
    await execute({ operation: updateVenue, input: { id: venue.id, name: "After" }, context: ai });
    await execute({ operation: listVenues, input: {}, context: user });
    const rows = await user.db.auditLog.findMany({ orderBy: { createdAt: "asc" } });
    expect(rows.map((row) => [row.operation, row.actorType])).toEqual([
      ["venue.create", "USER"],
      ["venue.update", "AI"],
    ]);
    const update = rows[1];
    expect(update?.conversationId).toBe("conv_1");
    expect(update?.entityId).toBe(venue.id);
    expect(update?.entityType).toBe("venue");
    expect(update?.before).toMatchObject({ name: "Before" });
    expect(update?.after).toMatchObject({ name: "After" });
  });

  it("writes nothing and changes nothing when a command fails", async () => {
    const context = testContext();
    const result = await execute({
      operation: updateVenue,
      input: { id: "missing", name: "X" },
      context,
    });
    expect(result.ok).toBe(false);
    expect(await context.db.auditLog.count()).toBe(0);
  });

  it("records who approved an AI command (approvedBy), and nothing for direct calls", async () => {
    const userId = `user_${createId()}`;
    const approved = testContext({
      actor: { type: "ai", userId, conversationId: "conv_2", approvedBy: userId },
    });
    await execute({ operation: createVenue, input: { name: "Approved" }, context: approved });
    const user = testContext({ organizationId: approved.organizationId, actor: { type: "user", userId } });
    await execute({ operation: createVenue, input: { name: "Direct" }, context: user });
    const rows = await user.db.auditLog.findMany({ orderBy: { createdAt: "asc" } });
    expect(rows.map((row) => [row.actorType, row.approvedBy, row.conversationId])).toEqual([
      ["AI", userId, "conv_2"],
      ["USER", null, null],
    ]);
  });
});
