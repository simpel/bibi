import { describe, expect, it } from "vitest";
import { optionQueuePositions } from "./option-queue";

const at = ({ hour }: { hour: number }) => new Date(Date.UTC(2026, 9, 15, hour));

type OptionInput = { id: string; itemId: string; start: number; end: number; created: number };

const option = ({ id, itemId, start, end, created }: OptionInput) => ({
  id,
  itemId,
  type: "OPTION" as const,
  startsAt: at({ hour: start }),
  endsAt: at({ hour: end }),
  createdAt: at({ hour: created }),
});

describe("option queue", () => {
  it("numbers overlapping options on one item by when they were placed", () => {
    const positions = optionQueuePositions({
      occupancies: [
        option({ id: "b", itemId: "room", start: 9, end: 12, created: 2 }),
        option({ id: "a", itemId: "room", start: 10, end: 11, created: 1 }),
        option({ id: "c", itemId: "room", start: 13, end: 14, created: 0 }),
        option({ id: "d", itemId: "other", start: 9, end: 12, created: 0 }),
      ],
    });
    expect(Object.fromEntries(positions)).toEqual({ a: 1, b: 2, c: 1, d: 1 });
  });

  it("ignores everything that is not an option", () => {
    const ticket = {
      ...option({ id: "x", itemId: "room", start: 9, end: 12, created: 0 }),
      type: "BOOKING" as const,
    };
    expect(optionQueuePositions({ occupancies: [ticket] }).size).toBe(0);
  });
});
