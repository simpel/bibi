import { NOTIFICATION_KINDS } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { splitNotificationQuery } from "./notification-query";

const labels = Object.fromEntries(
  NOTIFICATION_KINDS.map((kind) => [kind, `Name of ${kind}`]),
) as Record<(typeof NOTIFICATION_KINDS)[number], string>;
const first = NOTIFICATION_KINDS[0];

describe("splitNotificationQuery", () => {
  it("keeps plain text as text", () => {
    expect(splitNotificationQuery({ q: "budget", labels, word: "type" })).toEqual({
      text: "budget",
      kind: undefined,
    });
  });

  it("reads the kind by its id, the canonical word or the UI word", () => {
    for (const q of [`kind:${first} x`, `TYPE:${first} x`]) {
      expect(splitNotificationQuery({ q, labels, word: "type" })).toEqual({
        text: "x",
        kind: first,
      });
    }
  });

  it("reads a quoted name", () => {
    const q = `type:"name of ${first}"`;
    expect(splitNotificationQuery({ q, labels, word: "type" }).kind).toBe(first);
  });

  it("leaves an unknown value out of the filter", () => {
    expect(splitNotificationQuery({ q: "kind:nope", labels, word: "type" }).kind).toBeUndefined();
  });
});
