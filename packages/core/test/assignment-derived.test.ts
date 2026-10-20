import { describe, expect, it } from "vitest";
import { archiveLine, execute, unfollowAssignment } from "../src/index";
import { derivedSetup } from "./assignment-derived-helpers";
import { assignTo, followAs } from "./assignment-helpers";
import { unwrap } from "./helpers";

describe("derived assignments (ADR 0055)", () => {
  it("derives the responsibility from the lines, with its defaults, and stores nothing", async () => {
    const { context, ticket, erik, johan, part } = await derivedSetup();
    expect(await part()).toMatchObject({
      id: null,
      assigneeId: erik,
      assigneeSource: "DEFAULT",
      followers: [{ userId: johan, source: "DEFAULT" }],
    });
    expect(await context.db.assignment.count({ where: { recordId: ticket.id } })).toBe(0);
  });

  it("follows a changed default on every ticket with no data change", async () => {
    const { context, ticket, maria, update, part } = await derivedSetup();
    unwrap({ result: await update({ defaultAssigneeId: maria, defaultFollowerIds: [] }) });
    expect(await part()).toMatchObject({ assigneeId: maria, followers: [] });
    expect(await context.db.assignment.count({ where: { recordId: ticket.id } })).toBe(0);
  });

  it("stops applying when the covering line goes", async () => {
    const { context, held, part } = await derivedSetup();
    expect(await part()).toBeDefined();
    unwrap({ result: await execute({ operation: archiveLine, input: { id: held.id }, context }) });
    expect(await part()).toBeUndefined();
  });

  it("keeps an explicit assignee until it is removed, then falls back to the default", async () => {
    const { context, slot, johan, erik, part } = await derivedSetup();
    await assignTo({ context, ...slot, assigneeId: johan });
    expect(await part()).toMatchObject({ assigneeId: johan, assigneeSource: "EXPLICIT" });
    await assignTo({ context, ...slot, assigneeId: null });
    expect(await part()).toMatchObject({ assigneeId: erik, assigneeSource: "DEFAULT" });
  });

  it("lets a default follower leave and join again, and others follow", async () => {
    const { context, slot, johan, maria, part } = await derivedSetup();
    const left = unwrap({
      result: await execute({
        operation: unfollowAssignment,
        input: { ...slot, userId: johan },
        context,
      }),
    });
    expect(left.followers).toEqual([]);
    expect(left.id).not.toBeNull();
    const rows = await context.db.assignmentFollower.findMany({ where: { userId: johan } });
    expect(rows.map((row) => row.effect)).toEqual(["UNFOLLOW"]);
    expect((await followAs({ context, ...slot, userId: johan })).followers).toEqual([
      { userId: johan, source: "DEFAULT" },
    ]);
    expect(await context.db.assignmentFollower.count({ where: { userId: johan } })).toBe(0);
    await followAs({ context, ...slot, userId: maria });
    expect((await part())?.followers).toEqual([
      { userId: johan, source: "DEFAULT" },
      { userId: maria, source: "EXPLICIT" },
    ]);
  });
});
