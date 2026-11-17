import type { ExecuteContext } from "@bibi/core";
import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedOrder } from "./seed-order";
import { seedOrgMember } from "./seed-org-member";

/** One more member of the organization; returns the user id. */
async function addMember({ context }: { context: ExecuteContext }) {
  const userId = `user_${createId()}`;
  await getDb().user.create({ data: { id: userId, name: "Other", email: `${userId}@x.test` } });
  await getDb().member.create({
    data: {
      id: `member_${createId()}`,
      organizationId: context.organizationId,
      userId,
      role: "member",
      createdAt: new Date(),
    },
  });
  return userId;
}

/** An admin, the member to remove (signed in as well) and one other member. */
async function setup() {
  const context = testContext();
  const leaving = await seedOrgMember({ context });
  const other = await addMember({ context });
  const admin = await connect({ context });
  const actor = { type: "user" as const, userId: leaving.userId };
  const asLeaving = await connect({
    context: testContext({ organizationId: context.organizationId, access: "read", actor }),
  });
  const remove = () => call({ client: admin, name: "member_remove", args: { id: leaving.id } });
  return { context, leaving, other, admin, asLeaving, remove };
}

describe("member_remove leaves no relations behind", () => {
  it("drops their assignment and follow", async () => {
    const { leaving, other, admin, remove } = await setup();
    const { id } = await seedOrder({ client: admin });
    const subject = { subjectType: "ORDER", subjectId: id };
    await call({
      client: admin,
      name: "assignment_assign",
      args: { ...subject, assigneeId: leaving.userId },
    });
    await call({ client: admin, name: "assignment_follow", args: { ...subject, userId: other } });
    await call({
      client: admin,
      name: "assignment_follow",
      args: { ...subject, userId: leaving.userId },
    });
    expect((await remove()).isError).toBe(false);
    const slot = (await call({ client: admin, name: "assignment_list", args: subject })).data;
    const main = slot.items.find(
      (row: { responsibilityId: string | null }) => !row.responsibilityId,
    );
    expect(main.assigneeId).toBeNull();
    expect(main.followers.map((f: { userId: string }) => f.userId)).toEqual([other]);
  });

  it("refuses while they are a responsibility's default", async () => {
    const { leaving, admin, remove } = await setup();
    const created = await call({
      client: admin,
      name: "responsibility_create",
      args: { name: "Kitchen", defaultAssigneeId: leaving.userId },
    });
    expect(created.isError, JSON.stringify(created.data)).toBe(false);
    const result = await remove();
    expect(result.data.code).toBe("CONFLICT");
    expect(await getDb().member.findUnique({ where: { id: leaving.id } })).not.toBeNull();
  });

  it("archives their private view and hands a shared one to the remover", async () => {
    const { context, leaving, other, asLeaving, remove } = await setup();
    const create = ({ name }: { name: string }) =>
      call({ client: asLeaving, name: "board_create", args: { name } });
    const mine = (await create({ name: "Mine" })).data;
    const ours = (await create({ name: "Ours" })).data;
    const share = { id: ours.id, organization: false, userIds: [other] };
    expect((await call({ client: asLeaving, name: "board_share", args: share })).isError).toBe(
      false,
    );
    expect((await remove()).isError).toBe(false);
    const board = ({ id }: { id: string }) => getDb().board.findUniqueOrThrow({ where: { id } });
    expect((await board({ id: mine.id })).status).toBe("ARCHIVED");
    expect(await board({ id: ours.id })).toMatchObject({
      status: "ACTIVE",
      ownerId: context.actor.userId,
    });
    expect(await getDb().boardShare.count({ where: { userId: leaving.userId } })).toBe(0);
  });
});
