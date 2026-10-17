import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import {
  assignAssignment,
  type ExecuteContext,
  execute,
  markInquiryLost,
  qualifyInquiry,
} from "../src/index";
import { assignTo } from "./assignment-helpers";
import { memberUser } from "./booking-helpers";
import { errorCode, unwrap } from "./helpers";
import { createTestInquiry, inquirySetup } from "./inquiry-helpers";
import { testOrg } from "./org-helpers";

async function mainAssignee({ context, id }: { context: ExecuteContext; id: string }) {
  const row = await context.db.assignment.findFirst({
    where: { subjectType: "INQUIRY", subjectId: id, responsibilityId: null },
  });
  return row?.assigneeId ?? null;
}

async function newInquiry() {
  const setup = await inquirySetup();
  const inquiry = await createTestInquiry({
    context: setup.context,
    entityTypeId: setup.type.id,
    customerId: setup.customer.id,
  });
  return { ...setup, inquiry };
}

describe("inquiry.qualify (ADR 0022, 0034)", () => {
  it("requires a main assignee who is a member", async () => {
    const { context, inquiry } = await newInquiry();
    const id = inquiry.id;
    const noOwner = await execute({ operation: qualifyInquiry, input: { id }, context });
    expect(errorCode({ result: noOwner })).toBe("VALIDATION");
    const outsider = await memberUser({ context: await testOrg(), name: "Outsider" });
    const foreign = await execute({
      operation: qualifyInquiry,
      input: { id, assigneeId: outsider },
      context,
    });
    expect(errorCode({ result: foreign })).toBe("VALIDATION");
    const erik = await memberUser({ context, name: "Erik Lund" });
    const qualified = unwrap({
      result: await execute({
        operation: qualifyInquiry,
        input: { id, assigneeId: erik },
        context,
      }),
    });
    expect(qualified).toMatchObject({ inquiryStatus: "QUALIFIED" });
    expect(await mainAssignee({ context, id })).toBe(erik);
    expect(qualified.statusChangedAt.getTime()).toBeGreaterThan(inquiry.statusChangedAt.getTime());
    const again = await execute({ operation: qualifyInquiry, input: { id }, context });
    expect(errorCode({ result: again })).toBe("CONFLICT");
  });

  it("uses the assignee the inquiry already has", async () => {
    const { context, type, customer } = await inquirySetup();
    const erik = await memberUser({ context, name: "Erik Lund" });
    const inquiry = await createTestInquiry({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
      assigneeId: erik,
    });
    unwrap({
      result: await execute({ operation: qualifyInquiry, input: { id: inquiry.id }, context }),
    });
    expect(await mainAssignee({ context, id: inquiry.id })).toBe(erik);
  });
});

describe("inquiry.markLost (ADR 0022)", () => {
  it("requires a reason, stores it and makes the inquiry final", async () => {
    const { context, inquiry } = await newInquiry();
    const id = inquiry.id;
    const blank = await execute({
      operation: markInquiryLost,
      input: { id, lossReason: " " },
      context,
    });
    expect(errorCode({ result: blank })).toBe("VALIDATION");
    const lost = unwrap({
      result: await execute({
        operation: markInquiryLost,
        input: { id, lossReason: "Chose another venue" },
        context,
      }),
    });
    expect(lost).toMatchObject({ inquiryStatus: "LOST", lossReason: "Chose another venue" });
    const twice = await execute({
      operation: markInquiryLost,
      input: { id, lossReason: "x" },
      context,
    });
    expect(errorCode({ result: twice })).toBe("CONFLICT");
    const erik = await memberUser({ context, name: "Erik Lund" });
    const revive = await execute({
      operation: qualifyInquiry,
      input: { id, assigneeId: erik },
      context,
    });
    expect(errorCode({ result: revive })).toBe("CONFLICT");
    const audit = await getDb().auditLog.findMany({
      where: { entityId: id },
      orderBy: { createdAt: "asc" },
    });
    expect(audit.map((row) => row.operation)).toEqual(["inquiry.create", "inquiry.markLost"]);
  });
});

describe("assignment.assign on an inquiry (ADR 0034)", () => {
  it("changes the main assignee, and keeps one from QUALIFIED", async () => {
    const { context, inquiry } = await newInquiry();
    const id = inquiry.id;
    const subject = { subjectType: "INQUIRY" as const, subjectId: id };
    const erik = await memberUser({ context, name: "Erik Lund" });
    const johan = await memberUser({ context, name: "Johan Ek" });
    await assignTo({ context, ...subject, assigneeId: erik });
    unwrap({ result: await execute({ operation: qualifyInquiry, input: { id }, context }) });
    const removed = await execute({
      operation: assignAssignment,
      input: { ...subject, assigneeId: null },
      context,
    });
    expect(errorCode({ result: removed })).toBe("CONFLICT");
    await assignTo({ context, ...subject, assigneeId: johan });
    expect(await mainAssignee({ context, id })).toBe(johan);
  });
});
