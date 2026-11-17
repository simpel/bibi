import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import {
  createBoard,
  createResponsibility,
  type ExecuteContext,
  execute,
  removeMember,
  shareBoard,
} from "../src/index";
import { assignTo, followAs, orderSubject } from "./assignment-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import { createTestOrder, memberUser, orderSetup } from "./order-helpers";
import { addTestMemberWithUser } from "./org-helpers";

/** The member `userId` signed in to `of`'s organization. */
const as = ({ of, userId }: { of: ExecuteContext; userId: string }) =>
  testContext({
    organizationId: of.organizationId,
    access: "read",
    actor: { type: "user", userId },
  });

async function setup() {
  const { context, type, customer } = await orderSetup();
  const book = () => createTestOrder({ context, entityTypeId: type.id, customerId: customer.id });
  const johan = await addTestMemberWithUser({ context, role: "member", name: "Johan Ek" });
  const erik = await memberUser({ context, name: "Erik Lund" });
  const remove = () => execute({ operation: removeMember, input: { id: johan.memberId }, context });
  return { context, book, johan, erik, remove };
}

const audited = ({ context, entityType }: { context: ExecuteContext; entityType: string }) =>
  getDb().auditLog.findMany({
    where: { organizationId: context.organizationId, operation: "member.remove", entityType },
  });

describe("member.remove leaves no relations behind", () => {
  it("drops their assignments and follows, archiving rows left with no choice", async () => {
    const { context, book, johan, erik, remove } = await setup();
    const [first, second] = [await book(), await book()];
    const kept = await assignTo({ context, ...orderSubject(first), assigneeId: johan.userId });
    await followAs({ context, ...orderSubject(first), userId: erik });
    const emptied = await followAs({ context, ...orderSubject(second), userId: johan.userId });
    unwrap({ result: await remove() });
    const rows = await getDb().assignment.findMany({
      where: { id: { in: [kept.id ?? "", emptied.id ?? ""] } },
      include: { followers: true },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    expect(byId.get(kept.id ?? "")).toMatchObject({ assigneeId: null, status: "ACTIVE" });
    expect(byId.get(kept.id ?? "")?.followers.map((f) => f.userId)).toEqual([erik]);
    expect(byId.get(emptied.id ?? "")).toMatchObject({ status: "ARCHIVED", followers: [] });
    const audits = await audited({ context, entityType: "assignment" });
    expect(audits.map((row) => row.entityId).sort()).toEqual([kept.id, emptied.id].sort());
  });

  it("refuses while they are a responsibility's default assignee or follower", async () => {
    const { context, johan, erik, remove } = await setup();
    type CreateInput = { name: string; defaultAssigneeId: string; followers: string[] };
    const create = ({ name, defaultAssigneeId, followers }: CreateInput) =>
      execute({
        operation: createResponsibility,
        input: { name, defaultAssigneeId, entityTypeIds: [], defaultFollowerIds: followers },
        context,
      });
    const kitchen = unwrap({
      result: await create({ name: "Kitchen", defaultAssigneeId: johan.userId, followers: [] }),
    });
    const hosts = unwrap({
      result: await create({ name: "Hosts", defaultAssigneeId: erik, followers: [johan.userId] }),
    });
    const result = await remove();
    expect(errorCode({ result })).toBe("CONFLICT");
    if (result.ok) throw new Error("expected a conflict");
    expect(result.error.message).toContain("Hosts, Kitchen");
    expect(result.error.issues.map((issue) => issue.path)).toEqual([
      `responsibilities.${hosts.id}`,
      `responsibilities.${kitchen.id}`,
    ]);
    expect(await getDb().member.findUnique({ where: { id: johan.memberId } })).not.toBeNull();
  });

  it("archives their private views, hands shared ones to the remover and drops shares", async () => {
    const { context, johan, erik, remove } = await setup();
    const asJohan = as({ of: context, userId: johan.userId });
    const asErik = as({ of: context, userId: erik });
    const view = ({ name, by }: { name: string; by: ExecuteContext }) =>
      execute({ operation: createBoard, input: { name }, context: by });
    type ShareInput = { id: string; userIds: string[]; by: ExecuteContext };
    const share = ({ id, userIds, by }: ShareInput) =>
      execute({ operation: shareBoard, input: { id, organization: false, userIds }, context: by });
    const mine = unwrap({ result: await view({ name: "Johan's week", by: asJohan }) });
    const ours = unwrap({ result: await view({ name: "Our week", by: asJohan }) });
    unwrap({ result: await share({ id: ours.id, userIds: [erik], by: asJohan }) });
    const theirs = unwrap({ result: await view({ name: "Erik's week", by: asErik }) });
    unwrap({ result: await share({ id: theirs.id, userIds: [johan.userId], by: asErik }) });
    unwrap({ result: await remove() });
    const board = ({ id }: { id: string }) => getDb().board.findUniqueOrThrow({ where: { id } });
    expect(await board({ id: mine.id })).toMatchObject({
      status: "ARCHIVED",
      ownerId: johan.userId,
    });
    expect(await board({ id: ours.id })).toMatchObject({
      status: "ACTIVE",
      ownerId: context.actor.userId,
    });
    expect(await board({ id: theirs.id })).toMatchObject({ status: "ACTIVE", ownerId: erik });
    const left = await getDb().boardShare.count({ where: { userId: johan.userId } });
    expect(left).toBe(0);
    const audits = await audited({ context, entityType: "board" });
    expect(audits.map((row) => row.entityId).sort()).toEqual([mine.id, ours.id, theirs.id].sort());
  });
});
