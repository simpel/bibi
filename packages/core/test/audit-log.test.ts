import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import {
  createConversation,
  createVenue,
  type ExecuteContext,
  execute,
  getAuditLog,
  listAuditLogs,
  updateVenue,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { invite, withInviter } from "./invitation-helpers";
import { addTestMember, testOrg } from "./org-helpers";

type MakeVenueInput = { context: ExecuteContext; name: string };

const makeVenue = async ({ context, name }: MakeVenueInput) =>
  unwrap({ result: await execute({ operation: createVenue, input: { name }, context }) });

const list = async ({ context, input = {} }: { context: ExecuteContext; input?: object }) =>
  unwrap({ result: await execute({ operation: listAuditLogs, input, context }) });

describe("auditLog.list / auditLog.get", () => {
  it("returns an entity's history newest first with the AI marker and before/after", async () => {
    const user = testContext();
    const ai = testContext({
      organizationId: user.organizationId,
      actor: { type: "ai", userId: user.actor.userId, conversationId: "conv_1" },
    });
    const venue = await makeVenue({ context: user, name: "Before" });
    await makeVenue({ context: user, name: "Other" });
    await execute({ operation: updateVenue, input: { id: venue.id, name: "After" }, context: ai });
    const page = await list({
      context: user,
      input: { entityType: "venue", entityId: venue.id },
    });
    expect(page.items.map((row) => [row.operation, row.actorType])).toEqual([
      ["venue.update", "AI"],
      ["venue.create", "USER"],
    ]);
    expect(page.items[0]).toMatchObject({
      conversationId: "conv_1",
      before: { name: "Before" },
      after: { name: "After" },
    });
    const one = await execute({
      operation: getAuditLog,
      input: { id: page.items[1]?.id ?? "" },
      context: user,
    });
    expect(unwrap({ result: one })).toEqual(page.items[1]);
  });

  it("filters by actor type, conversation and time range, and pages with a cursor", async () => {
    const user = testContext();
    const ai = testContext({
      organizationId: user.organizationId,
      actor: { type: "ai", userId: user.actor.userId, conversationId: "conv_2" },
    });
    await makeVenue({ context: user, name: "One" });
    await makeVenue({ context: ai, name: "Two" });
    await makeVenue({ context: user, name: "Three" });
    expect((await list({ context: user, input: { actorType: "AI" } })).items).toHaveLength(1);
    const conv = await list({ context: user, input: { conversationId: "conv_2" } });
    expect(conv.items.map((row) => row.after)).toMatchObject([{ name: "Two" }]);
    const future = new Date(Date.now() + 60_000).toISOString();
    expect((await list({ context: user, input: { from: future } })).items).toEqual([]);
    const first = await list({ context: user, input: { limit: 2 } });
    expect(first.nextCursor).toBeTruthy();
    const rest = await list({ context: user, input: { limit: 2, cursor: first.nextCursor } });
    expect(rest.items.map((row) => row.after)).toMatchObject([{ name: "One" }]);
  });

  it("resolves the actor's member name", async () => {
    const org = await testOrg();
    const memberId = await addTestMember({ context: org, role: "Reader", name: "Ada Admin" });
    const member = await getDb().member.findUniqueOrThrow({ where: { id: memberId } });
    const actor = testContext({
      organizationId: org.organizationId,
      actor: { type: "user", userId: member.userId },
    });
    await makeVenue({ context: actor, name: "Named" });
    const [row] = (await list({ context: org })).items;
    expect(row).toMatchObject({ actorId: member.userId, actorName: "Ada Admin" });
  });

  it("needs audit:read and shows nothing from another organization", async () => {
    const owner = testContext();
    const venue = await makeVenue({ context: owner, name: "Mine" });
    const noAudit = testContext({
      organizationId: owner.organizationId,
      permissions: { venue: ["read"] },
    });
    expect(
      errorCode({
        result: await execute({ operation: listAuditLogs, input: {}, context: noAudit }),
      }),
    ).toBe("FORBIDDEN");
    const stranger = testContext({ permissions: { audit: ["read"] } });
    const theirs = await list({ context: stranger, input: { entityId: venue.id } });
    expect(theirs.items).toEqual([]);
    const id = (await list({ context: owner })).items[0]?.id ?? "";
    const result = await execute({ operation: getAuditLog, input: { id }, context: stranger });
    expect(errorCode({ result })).toBe("NOT_FOUND");
  });

  it("hides other users' private conversation changes unless conversation:admin", async () => {
    const owner = testContext();
    await execute({ operation: createConversation, input: { title: "Private" }, context: owner });
    const peer = testContext({
      organizationId: owner.organizationId,
      permissions: { audit: ["read"], conversation: ["write"] },
    });
    const admin = testContext({
      organizationId: owner.organizationId,
      permissions: { audit: ["read"], conversation: ["admin"] },
    });
    const filter = { entityType: "conversation" };
    expect((await list({ context: peer, input: filter })).items).toEqual([]);
    expect((await list({ context: owner, input: filter })).items).toHaveLength(1);
    expect((await list({ context: admin, input: filter })).items).toHaveLength(1);
  });

  it("hides pending invitations' audit rows unless member:admin", async () => {
    const inviter = await withInviter();
    unwrap({
      result: await invite({ context: inviter, email: "secret@example.test", role: "viewer" }),
    });
    const peer = testContext({
      organizationId: inviter.organizationId,
      permissions: { audit: ["read"], member: ["read"] },
    });
    const admin = testContext({
      organizationId: inviter.organizationId,
      permissions: { audit: ["read"], member: ["admin"] },
    });
    const filter = { entityType: "invitation" };
    expect((await list({ context: peer, input: filter })).items).toEqual([]);
    expect((await list({ context: inviter, input: filter })).items).toHaveLength(1);
    expect((await list({ context: admin, input: filter })).items).toHaveLength(1);
  });
});
