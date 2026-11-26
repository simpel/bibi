import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { STARTS, seedReservation } from "./reservation-seed";

describe("approval summaries: table reservations (ADR 0119)", () => {
  it("reads like the booking, in the organization's zone", async () => {
    const userId = `user_${createId()}`;
    const base = testContext({ actor: { type: "user", userId } });
    const user = await connect({ context: base });
    const assistant = await connect({
      context: testContext({
        organizationId: base.organizationId,
        actor: { type: "ai", userId, conversationId: "conv_1" },
      }),
    });
    const { roomItemId, reservationId, elementIds } = await seedReservation({ client: user });

    const summaryOf = async ({ name, args }: { name: string; args: Record<string, unknown> }) => {
      const proposal = await call({ client: assistant, name, args });
      expect(proposal.data.status, JSON.stringify(proposal.data)).toBe("approval_required");
      return proposal.data.summary as string;
    };

    expect(
      await summaryOf({
        name: "reservation_create",
        args: {
          roomItemId,
          startsAt: "2037-12-04T17:30:00.000Z",
          partySize: 4,
          bookerName: "Andersson",
        },
      }),
    ).toBe("Book 4 at 18:30 on 4 Dec for Andersson");
    expect(await summaryOf({ name: "reservation_cancel", args: { id: reservationId } })).toBe(
      "Cancel the reservation for Secret booker at 18:00 on 3 Nov",
    );
    expect(STARTS).toBe("2037-11-03T17:00:00.000Z");
    expect(
      await summaryOf({
        name: "tableBlock_create",
        args: {
          elementIds,
          startsAt: "2037-11-06T16:00:00.000Z",
          endsAt: "2037-11-06T22:00:00.000Z",
        },
      }),
    ).toBe("Block tables T1, T2 on 6 Nov 17:00-23:00");
  });
});
