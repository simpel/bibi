import { describe, expect, it } from "vitest";
import {
  assignAssignment,
  createResponsibility,
  execute,
  listBookings,
  listInquiries,
  listMyAssignments,
} from "../src/index";
import { assignTo, bookingSubject, followAs } from "./assignment-helpers";
import { bookingSetup, createTestBooking, memberUser } from "./booking-helpers";
import { errorCode, testContext, unwrap } from "./helpers";

async function setup() {
  const { context, type, customer } = await bookingSetup();
  const book = () => createTestBooking({ context, entityTypeId: type.id, customerId: customer.id });
  const [first, second] = [await book(), await book()];
  const erik = await memberUser({ context, name: "Erik Lund" });
  const johan = await memberUser({ context, name: "Johan Ek" });
  return { context, first, second, erik, johan };
}

describe("assignment.listMine and the list filters (ADR 0034)", () => {
  it("lists what a member is assigned to and what they follow", async () => {
    const { context, first, second, erik, johan } = await setup();
    await assignTo({ context, ...bookingSubject(first), assigneeId: johan });
    await followAs({ context, ...bookingSubject(second), userId: johan });
    await assignTo({ context, ...bookingSubject(second), assigneeId: erik });
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
      execute({ operation: listBookings, input: { limit: 50, ...filter }, context });
    const byAssignee = unwrap({ result: await page({ filter: { assigneeId: johan } }) });
    expect(byAssignee.items.map((row) => row.id)).toEqual([first.id]);
    const byFollower = unwrap({ result: await page({ filter: { followerId: johan } }) });
    expect(byFollower.items.map((row) => row.id)).toEqual([second.id]);
    const inquiries = unwrap({
      result: await execute({
        operation: listInquiries,
        input: { limit: 50, assigneeId: johan },
        context,
      }),
    });
    expect(inquiries.items).toEqual([]);
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
    const subject = bookingSubject(first);
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
    const onInquiry = await execute({
      operation: assignAssignment,
      input: {
        subjectType: "INQUIRY",
        subjectId: "x",
        responsibilityId: kitchen.id,
        assigneeId: erik,
      },
      context,
    });
    expect(errorCode({ result: onInquiry })).toBe("NOT_FOUND");
    const count = await context.db.assignment.count({ where: { subjectId: first.id } });
    expect(count).toBe(2);
  });
});
