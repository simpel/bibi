import { describe, expect, it } from "vitest";
import { ok } from "../src/errors/result";
import {
  createReservation,
  createSystemContext,
  execute,
  type ReservationMailMessage,
  remindReservations,
  setReservationMailer,
} from "../src/index";
import { diningRoomReady } from "./dining-helpers";
import { testContext, unwrap } from "./helpers";

describe("reminders the day before (ADR 0119)", () => {
  it("mails tomorrow's guests once", async () => {
    const sent: ReservationMailMessage[] = [];
    setReservationMailer({
      mailer: async (message) => {
        sent.push(message);
        return ok({ value: true });
      },
    });
    const context = testContext();
    const { item } = await diningRoomReady({ context });
    const startsAt = new Date(Math.ceil((Date.now() + 24 * 3_600_000) / 60_000) * 60_000);
    const booked = unwrap({
      result: await execute({
        operation: createReservation,
        input: {
          ...{ roomItemId: item.id, startsAt, partySize: 2, bookerName: "Anna Lind" },
          bookerEmail: "anna@example.com",
        },
        context,
      }),
    });
    sent.length = 0;
    const system = createSystemContext({ organizationId: context.organizationId });
    const first = unwrap({
      result: await execute({ operation: remindReservations, input: {}, context: system }),
    });
    expect(first.ids).toEqual([booked.id]);
    expect(sent.map((m) => [m.kind, m.to])).toEqual([["reminder", "anna@example.com"]]);
    const second = unwrap({
      result: await execute({ operation: remindReservations, input: {}, context: system }),
    });
    expect(second.ids).toEqual([]);
    setReservationMailer({ mailer: undefined });
  });
});
