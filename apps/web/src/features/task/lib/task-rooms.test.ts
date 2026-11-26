import { describe, expect, it } from "vitest";
import {
  defaultWindow,
  roomsWith,
  roomsWithout,
  type TaskRoomView,
  toItemInput,
} from "./task-rooms";

const room = ({ over }: { over: Partial<TaskRoomView> }): TaskRoomView => ({
  id: "ti1",
  itemId: "atrium",
  name: "Atrium",
  href: "/items/atrium",
  hold: "RELATED",
  startsAt: null,
  endsAt: null,
  window: null,
  ...over,
});

describe("defaultWindow", () => {
  it("is the due time's day in the organization's zone", () => {
    // 23:30 UTC on 30 Nov is already 1 Dec in Stockholm.
    const dueAt = new Date("2026-11-30T23:30:00Z");
    expect(defaultWindow({ dueAt, timeZone: "Europe/Stockholm" })).toEqual({
      startsAt: "2026-12-01T00:00",
      endsAt: "2026-12-02T00:00",
    });
  });

  it("rolls over a month end", () => {
    const dueAt = new Date("2026-12-31T10:00:00Z");
    expect(defaultWindow({ dueAt, timeZone: "UTC" }).endsAt).toBe("2027-01-01T00:00");
  });

  it("is empty without a due time", () => {
    expect(defaultWindow({ dueAt: null, timeZone: "UTC" })).toEqual({ startsAt: "", endsAt: "" });
  });
});

describe("toItemInput", () => {
  it("drops the window of a related room", () => {
    const input = toItemInput({
      room: { itemId: "a", hold: "RELATED", startsAt: "2026-12-01T08:00", endsAt: "" },
      timeZone: "UTC",
    });
    expect(input).toEqual({ itemId: "a", hold: "RELATED" });
  });

  it("reads a held room's window as instants", () => {
    const input = toItemInput({
      room: { itemId: "a", hold: "BOOK", startsAt: "2026-12-01T08:00", endsAt: "2026-12-01T17:00" },
      timeZone: "UTC",
    });
    expect(input.startsAt).toEqual(new Date("2026-12-01T08:00:00Z"));
    expect(input.endsAt).toEqual(new Date("2026-12-01T17:00:00Z"));
  });
});

describe("the whole set", () => {
  const rooms = [
    room({ over: { id: "ti1", itemId: "a" } }),
    room({ over: { id: "ti2", itemId: "b" } }),
  ];

  it("appends a new room", () => {
    const set = roomsWith({ rooms, editing: null, next: { itemId: "c", hold: "RELATED" } });
    expect(set.map((item) => item.itemId)).toEqual(["a", "b", "c"]);
  });

  it("replaces the room being edited in place", () => {
    const set = roomsWith({ rooms, editing: "ti2", next: { itemId: "b", hold: "PREBOOK" } });
    expect(set.map((item) => item.hold)).toEqual(["RELATED", "PREBOOK"]);
  });

  it("leaves one out", () => {
    expect(roomsWithout({ rooms, id: "ti1" }).map((item) => item.itemId)).toEqual(["b"]);
  });
});
