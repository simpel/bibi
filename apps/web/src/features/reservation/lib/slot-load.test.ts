import { expect, test } from "vitest";
import { loadTone, slotLoad } from "./slot-load";

const row = ({
  partySize,
  startsAtMs,
  endsAtMs,
  state = "BOOKED",
}: {
  partySize: number;
  startsAtMs: number;
  endsAtMs: number;
  state?: string;
}) => ({ partySize, startsAtMs, endsAtMs, state }) as never;

test("counts the parties at tables at that instant, not no-shows", () => {
  const rows = [
    row({ partySize: 4, startsAtMs: 0, endsAtMs: 100 }),
    row({ partySize: 2, startsAtMs: 50, endsAtMs: 150 }),
    row({ partySize: 6, startsAtMs: 0, endsAtMs: 100, state: "NO_SHOW" }),
    row({ partySize: 3, startsAtMs: 100, endsAtMs: 200 }),
  ];
  expect(slotLoad({ rows, ms: 60, seats: 20 })).toEqual({ taken: 6, seats: 20, ratio: 0.3 });
  expect(slotLoad({ rows, ms: 100, seats: 20 }).taken).toBe(5);
});

test("tones and an empty floor", () => {
  expect(loadTone({ ratio: 0.3 })).toBe("low");
  expect(loadTone({ ratio: 0.6 })).toBe("mid");
  expect(loadTone({ ratio: 1 })).toBe("full");
  expect(slotLoad({ rows: [], ms: 0, seats: 0 }).ratio).toBe(0);
});
