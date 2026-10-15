import { describe, expect, it } from "vitest";
import { createBooking, execute, getBooking, listBookings, updateBooking } from "../src/index";
import { bookingSetup, createTestBooking } from "./booking-helpers";
import { statuses } from "./booking-status-helpers";
import { createTestCustomer } from "./customer-helpers";
import { errorCode, testContext, unwrap } from "./helpers";

const startsAt = new Date("2026-11-03T08:00:00Z");
const endsAt = new Date("2026-11-03T16:00:00Z");

describe("bookings (ADR 0022)", () => {
  it("creates bookings with sequential references and the default TENTATIVE status", async () => {
    const { context, type, key, customer } = await bookingSetup();
    const created = unwrap({
      result: await execute({
        operation: createBooking,
        input: {
          entityTypeId: type.id,
          customerId: customer.id,
          startsAt,
          endsAt,
          estimatedHeadcount: 40,
          fields: { [key]: "Kickoff" },
        },
        context,
      }),
    });
    const tentative = (await statuses({ context })).find((s) => s.phase === "TENTATIVE");
    expect(created).toMatchObject({
      reference: 1,
      bookingStatusId: tentative?.id,
      estimatedHeadcount: 40,
      salesOwnerId: null,
      coordinatorId: null,
      fields: { [key]: "Kickoff" },
    });
    const second = await createTestBooking({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    expect(second.reference).toBe(2);
    const fetched = unwrap({
      result: await execute({ operation: getBooking, input: { id: created.id }, context }),
    });
    expect(fetched.id).toBe(created.id);
  });

  it("updates time, headcount and fields but refuses an end before the start", async () => {
    const { context, key, type, customer } = await bookingSetup();
    const booking = await createTestBooking({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const updated = unwrap({
      result: await execute({
        operation: updateBooking,
        input: { id: booking.id, guaranteedHeadcount: 38, fields: { [key]: "Offsite" } },
        context,
      }),
    });
    expect(updated).toMatchObject({ guaranteedHeadcount: 38, fields: { [key]: "Offsite" } });
    const backwards = await execute({
      operation: updateBooking,
      input: { id: booking.id, endsAt: new Date(booking.startsAt.getTime() - 1) },
      context,
    });
    expect(backwards.ok ? null : backwards.error.issues[0]?.path).toBe("endsAt");
  });

  it("refuses an unknown customer, a type of another base and unknown fields", async () => {
    const { context, type, customer } = await bookingSetup();
    const base = { entityTypeId: type.id, customerId: customer.id, startsAt, endsAt };
    const issue = async ({ input }: { input: Record<string, unknown> }) => {
      const result = await execute({ operation: createBooking, input, context });
      return result.ok ? null : result.error.issues[0]?.path;
    };
    expect(await issue({ input: { ...base, customerId: "missing" } })).toBe("customerId");
    expect(await issue({ input: { ...base, entityTypeId: customer.entityTypeId } })).toBe(
      "entityTypeId",
    );
    expect(await issue({ input: { ...base, fields: { nope: 1 } } })).toBe("fields.nope");
  });

  it("filters the list and never shows another organization's bookings", async () => {
    const { context, type, customer } = await bookingSetup();
    const otherCustomer = await createTestCustomer({ context, name: "Kvarnby Design AB" });
    const booking = await createTestBooking({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    await createTestBooking({ context, entityTypeId: type.id, customerId: otherCustomer.id });
    const list = unwrap({
      result: await execute({
        operation: listBookings,
        input: { customerId: customer.id },
        context,
      }),
    });
    expect(list.items.map((item) => item.id)).toEqual([booking.id]);
    const other = testContext();
    const get = await execute({ operation: getBooking, input: { id: booking.id }, context: other });
    expect(errorCode({ result: get })).toBe("NOT_FOUND");
    const none = unwrap({
      result: await execute({ operation: listBookings, input: {}, context: other }),
    });
    expect(none.items).toEqual([]);
  });
});
