import { describe, expect, it } from "vitest";
import { ok } from "../src/errors/result";
import {
  createTableBlock,
  execute,
  organizationOfPage,
  organizationOfToken,
  publicAvailability,
  publicBookingPage,
  publicCancelReservation,
  publicChangeReservation,
  publicCreateReservation,
  publicGetReservation,
  type ReservationMailMessage,
  runGuest,
  setReservationMailer,
  updateBookingPage,
  updateDiningService,
} from "../src/index";
import { aheadDate, at, diningRoomReady } from "./dining-helpers";
import { errorCode, testContext, unwrap } from "./helpers";

const guest = {
  bookerName: "Anna Lind",
  bookerPhone: "070-1234567",
  bookerEmail: "anna@example.com",
  locale: "en" as const,
};

/** A dining room with a published page; the page slug. */
async function publishedRoom() {
  const context = testContext();
  const ready = await diningRoomReady({ context });
  const slug = `kajen-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  unwrap({
    result: await execute({
      operation: updateBookingPage,
      input: { slug, published: true },
      context,
    }),
  });
  return { context, ...ready, slug };
}

describe("guests book their own table (ADR 0119)", () => {
  it("reads the page, books, changes and cancels with the manage token, mailing each step", async () => {
    const sent: ReservationMailMessage[] = [];
    setReservationMailer({
      mailer: async (message) => {
        sent.push(message);
        return ok({ value: true });
      },
    });
    const { slug } = await publishedRoom();
    const organizationId = await organizationOfPage({ slug });
    const guestRun = <I>({
      operation,
      input,
    }: {
      operation: Parameters<typeof runGuest>[0]["operation"];
      input: I;
    }) => runGuest({ organizationId, operation, input });

    const page = unwrap({
      result: await guestRun({ operation: publicBookingPage, input: { slug } }),
    }) as {
      rooms: { slug: string; maxOnlineParty: number }[];
    };
    expect(page.rooms).toEqual([{ slug: "kajen", name: "Kajen", maxOnlineParty: 8 }]);

    const { date, iso } = aheadDate({});
    const free = unwrap({
      result: await guestRun({
        operation: publicAvailability,
        input: { slug, roomSlug: "kajen", date: iso, partySize: 2 },
      }),
    }) as { slots: { startsAt: Date }[] };
    expect(free.slots.length).toBeGreaterThan(0);

    const booked = unwrap({
      result: await guestRun({
        operation: publicCreateReservation,
        input: {
          slug,
          roomSlug: "kajen",
          startsAt: at({ date, hour: 19 }),
          partySize: 2,
          ...guest,
        },
      }),
    }) as { token: string; reservation: { canChange: boolean } };
    expect(booked.reservation.canChange).toBe(true);
    expect(sent.map((m) => m.kind)).toEqual(["confirmation"]);
    expect(sent[0]?.manageUrl).toContain(`/en/book/manage/${booked.token}`);

    const byToken = await organizationOfToken({ token: booked.token });
    expect(byToken).toBe(organizationId);
    const tokenRun = <I>({
      operation,
      input,
    }: {
      operation: Parameters<typeof runGuest>[0]["operation"];
      input: I;
    }) => runGuest({ organizationId: byToken, operation, input });
    const changed = unwrap({
      result: await tokenRun({
        operation: publicChangeReservation,
        input: { token: booked.token, startsAt: at({ date, hour: 20 }) },
      }),
    }) as { startsAt: Date };
    expect(changed.startsAt).toEqual(at({ date, hour: 20 }));
    const cancelled = unwrap({
      result: await tokenRun({
        operation: publicCancelReservation,
        input: { token: booked.token },
      }),
    }) as { state: string; canChange: boolean };
    expect(cancelled).toMatchObject({ state: "CANCELLED", canChange: false });
    expect(sent.map((m) => m.kind)).toEqual(["confirmation", "changed", "cancelled"]);
    const again = await tokenRun({
      operation: publicCancelReservation,
      input: { token: booked.token },
    });
    expect(errorCode({ result: again as never })).toBe("CONFLICT");
    setReservationMailer({ mailer: undefined });
  });

  it("keeps guests to the online rules", async () => {
    const { context, table, sitting, slug } = await publishedRoom();
    const organizationId = await organizationOfPage({ slug });
    const { date } = aheadDate({});
    const book = ({ ...extra }: Record<string, unknown>) =>
      runGuest({
        organizationId,
        operation: publicCreateReservation,
        input: {
          slug,
          roomSlug: "kajen",
          startsAt: at({ date, hour: 19 }),
          partySize: 2,
          ...guest,
          ...extra,
        },
      });
    // Not a sitting time, and too big a party for online.
    expect(
      errorCode({
        result: (await book({ startsAt: at({ date, hour: 19, minute: 10 }) })) as never,
      }),
    ).toBe("CONFLICT");
    expect(errorCode({ result: (await book({ partySize: 9 })) as never })).toBe("CONFLICT");
    // Online-only blocks keep tables 1 and 2 from guests; table 3 is too big, 4 is staff-only.
    const evening = { startsAt: at({ date, hour: 17 }), endsAt: at({ date, hour: 23 }) };
    unwrap({
      result: await execute({
        operation: createTableBlock,
        input: {
          elementIds: [table({ label: "1" }), table({ label: "2" })],
          kind: "ONLINE_ONLY",
          ...evening,
        },
        context,
      }),
    });
    const smallTables = unwrap({ result: (await book({})) as never }) as {
      reservation: { partySize: number };
    };
    expect(smallTables.reservation.partySize).toBe(2);
    // Within the cutoff a guest can no longer change.
    unwrap({
      result: await execute({
        operation: updateDiningService,
        input: { id: sitting.id, changeCutoffMinutes: 10_080 },
        context,
      }),
    });
    const late = unwrap({
      result: (await book({ startsAt: at({ date, hour: 17 }) })) as never,
    }) as {
      token: string;
      reservation: { canChange: boolean };
    };
    expect(late.reservation.canChange).toBe(false);
    const read = unwrap({
      result: await runGuest({
        organizationId,
        operation: publicGetReservation,
        input: { token: late.token },
      }),
    }) as { canChange: boolean };
    expect(read.canChange).toBe(false);
  });

  it("finds nothing for an unknown page or token", async () => {
    expect(await organizationOfPage({ slug: "no-such-page" })).toBeNull();
    expect(await organizationOfToken({ token: "not-a-token" })).toBeNull();
    const result = await runGuest({
      organizationId: null,
      operation: publicBookingPage,
      input: { slug: "x" },
    });
    expect(errorCode({ result: result as never })).toBe("NOT_FOUND");
  });
});
