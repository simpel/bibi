import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { assignInquiry, execute, markInquiryLost, qualifyInquiry } from "../src/index";
import { memberUser } from "./booking-helpers";
import { errorCode, unwrap } from "./helpers";
import { createTestInquiry, inquirySetup } from "./inquiry-helpers";
import { testOrg } from "./org-helpers";

async function newInquiry() {
  const setup = await inquirySetup();
  const inquiry = await createTestInquiry({
    context: setup.context,
    entityTypeId: setup.type.id,
    customerId: setup.customer.id,
  });
  return { ...setup, inquiry };
}

describe("inquiry.qualify (ADR 0022)", () => {
  it("requires a salesperson who is a member", async () => {
    const { context, inquiry } = await newInquiry();
    const id = inquiry.id;
    const noOwner = await execute({ operation: qualifyInquiry, input: { id }, context });
    expect(errorCode({ result: noOwner })).toBe("VALIDATION");
    const outsider = await memberUser({ context: await testOrg(), name: "Outsider" });
    const foreign = await execute({
      operation: qualifyInquiry,
      input: { id, salesOwnerId: outsider },
      context,
    });
    expect(errorCode({ result: foreign })).toBe("VALIDATION");
    const erik = await memberUser({ context, name: "Erik Lund" });
    const qualified = unwrap({
      result: await execute({
        operation: qualifyInquiry,
        input: { id, salesOwnerId: erik },
        context,
      }),
    });
    expect(qualified).toMatchObject({ inquiryStatus: "QUALIFIED", salesOwnerId: erik });
    expect(qualified.statusChangedAt.getTime()).toBeGreaterThan(inquiry.statusChangedAt.getTime());
    const again = await execute({ operation: qualifyInquiry, input: { id }, context });
    expect(errorCode({ result: again })).toBe("CONFLICT");
  });

  it("uses the owner the inquiry already has", async () => {
    const { context, type, customer } = await inquirySetup();
    const erik = await memberUser({ context, name: "Erik Lund" });
    const inquiry = await createTestInquiry({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
      salesOwnerId: erik,
    });
    const qualified = unwrap({
      result: await execute({ operation: qualifyInquiry, input: { id: inquiry.id }, context }),
    });
    expect(qualified.salesOwnerId).toBe(erik);
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
      input: { id, salesOwnerId: erik },
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

describe("inquiry.assign (ADR 0022)", () => {
  it("changes the owner, and keeps one from QUALIFIED", async () => {
    const { context, inquiry } = await newInquiry();
    const id = inquiry.id;
    const erik = await memberUser({ context, name: "Erik Lund" });
    const johan = await memberUser({ context, name: "Johan Ek" });
    const assigned = unwrap({
      result: await execute({
        operation: assignInquiry,
        input: { id, salesOwnerId: erik },
        context,
      }),
    });
    expect(assigned.salesOwnerId).toBe(erik);
    unwrap({ result: await execute({ operation: qualifyInquiry, input: { id }, context }) });
    const removed = await execute({
      operation: assignInquiry,
      input: { id, salesOwnerId: null },
      context,
    });
    expect(errorCode({ result: removed })).toBe("CONFLICT");
    const changed = unwrap({
      result: await execute({
        operation: assignInquiry,
        input: { id, salesOwnerId: johan },
        context,
      }),
    });
    expect(changed).toMatchObject({ salesOwnerId: johan, inquiryStatus: "QUALIFIED" });
  });
});
