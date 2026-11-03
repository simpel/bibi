import { describe, expect, it } from "vitest";
import {
  approveSeat,
  execute,
  getBilling,
  listSeatRequests,
  rejectSeat,
  updateBilling,
} from "../src/index";
import { fillSeats, setBillingRow, useMemoryBilling } from "./billing-helpers";
import { errorCode, unwrap } from "./helpers";
import { invite, withInviter } from "./invitation-helpers";

const billingOf = async ({ context }: { context: Awaited<ReturnType<typeof withInviter>> }) =>
  unwrap({ result: await execute({ operation: getBilling, input: {}, context }) });

describe("seats (ADR 0095 §6)", () => {
  useMemoryBilling();

  it("adds a paid seat when every seat is taken and auto-assign is on", async () => {
    const context = await withInviter();
    await fillSeats({ context, count: 9 });
    const tenth = unwrap({
      result: await invite({ context, email: "ten@example.test", role: "member" }),
    });
    expect(tenth.status).toBe("pending");
    expect((await billingOf({ context })).seats).toMatchObject({ extra: 0, used: 10 });
    const eleventh = unwrap({
      result: await invite({ context, email: "eleven@example.test", role: "member" }),
    });
    expect(eleventh.status).toBe("pending");
    expect((await billingOf({ context })).seats).toMatchObject({ extra: 1, used: 11 });
  });

  it("holds the invitation for an admin when auto-assign is off", async () => {
    const context = await withInviter();
    await setBillingRow({ context, data: { autoAssignSeats: false } });
    await fillSeats({ context, count: 10 });
    const held = unwrap({
      result: await invite({ context, email: "held@example.test", role: "member" }),
    });
    expect(held.status).toBe("held");
    const again = await invite({ context, email: "held@example.test", role: "member" });
    expect(errorCode({ result: again })).toBe("CONFLICT");
    const requests = unwrap({
      result: await execute({ operation: listSeatRequests, input: {}, context }),
    });
    expect(requests.items.map((item) => item.id)).toEqual([held.id]);
    const approved = unwrap({
      result: await execute({ operation: approveSeat, input: { id: held.id }, context }),
    });
    expect(approved.status).toBe("pending");
    expect((await billingOf({ context })).seats).toMatchObject({ extra: 1, used: 11, held: 0 });
    const twice = await execute({ operation: approveSeat, input: { id: held.id }, context });
    expect(errorCode({ result: twice })).toBe("NOT_FOUND");
  });

  it("declines a held invitation without adding a seat", async () => {
    const context = await withInviter();
    await setBillingRow({ context, data: { autoAssignSeats: false } });
    await fillSeats({ context, count: 10 });
    const held = unwrap({
      result: await invite({ context, email: "no@example.test", role: "member" }),
    });
    const declined = unwrap({
      result: await execute({ operation: rejectSeat, input: { id: held.id }, context }),
    });
    expect(declined.status).toBe("canceled");
    expect((await billingOf({ context })).seats).toMatchObject({ extra: 0, held: 0 });
  });

  it("never lowers the extra seats below what is in use", async () => {
    const context = await withInviter();
    await setBillingRow({ context, data: { extraSeats: 3 } });
    await fillSeats({ context, count: 12 });
    const tooFew = await execute({ operation: updateBilling, input: { extraSeats: 1 }, context });
    expect(errorCode({ result: tooFew })).toBe("VALIDATION");
    const ok = unwrap({
      result: await execute({
        operation: updateBilling,
        input: { extraSeats: 2, autoAssignSeats: false },
        context,
      }),
    });
    expect(ok).toMatchObject({ autoAssignSeats: false, seats: { extra: 2 } });
  });

  it("refuses billing changes to members without billing:write", async () => {
    const context = await withInviter();
    const member = { ...context, permissions: {}, roles: ["member"] };
    const refused = await execute({
      operation: updateBilling,
      input: { autoAssignSeats: false },
      context: member,
    });
    expect(errorCode({ result: refused })).toBe("FORBIDDEN");
  });
});
