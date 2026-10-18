import { describe, expect, it } from "vitest";
import {
  assignAssignment,
  createResponsibility,
  execute,
  listMyAssignments,
  listTickets,
} from "../src/index";
import { assignTo, followAs, ticketSubject } from "./assignment-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import { createTestTicket, memberUser, ticketSetup } from "./ticket-helpers";

async function setup() {
  const { context, type, customer } = await ticketSetup();
  const book = () => createTestTicket({ context, entityTypeId: type.id, customerId: customer.id });
  const [first, second] = [await book(), await book()];
  const erik = await memberUser({ context, name: "Erik Lund" });
  const johan = await memberUser({ context, name: "Johan Ek" });
  return { context, first, second, erik, johan };
}

describe("assignment.listMine and the list filters (ADR 0034)", () => {
  it("lists what a member is assigned to and what they follow", async () => {
    const { context, first, second, erik, johan } = await setup();
    await assignTo({ context, ...ticketSubject(first), assigneeId: johan });
    await followAs({ context, ...ticketSubject(second), userId: johan });
    await assignTo({ context, ...ticketSubject(second), assigneeId: erik });
    const asJohan = testContext({
      organizationId: context.organizationId,
      actor: { type: "user", userId: johan },
    });
    const mine = ({ kind }: { kind: "ASSIGNED" | "FOLLOWING" }) =>
      execute({ operation: listMyAssignments, input: { kind, limit: 50 }, context: asJohan });
    const assigned = unwrap({ result: await mine({ kind: "ASSIGNED" }) });
    expect(assigned.items.map((row) => row.subjectId)).toEqual([first.id]);
    const following = unwrap({ result: await mine({ kind: "FOLLOWING" }) });
    expect(following.items.map((row) => row.subjectId)).toEqual([second.id]);
    const page = ({ filter }: { filter: { assigneeId: string } | { followerId: string } }) =>
      execute({ operation: listTickets, input: { limit: 50, ...filter }, context });
    const byAssignee = unwrap({ result: await page({ filter: { assigneeId: johan } }) });
    expect(byAssignee.items.map((row) => row.id)).toEqual([first.id]);
    const byFollower = unwrap({ result: await page({ filter: { followerId: johan } }) });
    expect(byFollower.items.map((row) => row.id)).toEqual([second.id]);
  });

  it("keeps one assignment per responsibility next to the main one", async () => {
    const { context, first, erik, johan } = await setup();
    const kitchen = unwrap({
      result: await execute({
        operation: createResponsibility,
        input: { name: "Head of kitchen", entityTypeIds: [], defaultAssigneeId: erik },
        context,
      }),
    });
    const subject = ticketSubject(first);
    await assignTo({ context, ...subject, assigneeId: johan });
    const part = await assignTo({
      context,
      ...subject,
      responsibilityId: kitchen.id,
      assigneeId: erik,
    });
    expect(part).toMatchObject({ responsibilityId: kitchen.id, assigneeId: erik });
    const again = await assignTo({
      context,
      ...subject,
      responsibilityId: kitchen.id,
      assigneeId: johan,
    });
    expect(again.id).toBe(part.id);
    const onItem = await execute({
      operation: assignAssignment,
      input: {
        subjectType: "ITEM",
        subjectId: "x",
        responsibilityId: kitchen.id,
        assigneeId: erik,
      },
      context,
    });
    expect(errorCode({ result: onItem })).toBe("NOT_FOUND");
    const count = await context.db.assignment.count({ where: { subjectId: first.id } });
    expect(count).toBe(2);
  });
});
