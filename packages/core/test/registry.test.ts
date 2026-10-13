import { describe, expect, it } from "vitest";
import {
  createCoreOperations,
  createVenue,
  getOperation,
  listOperations,
  listVenues,
  registerOperations,
  requiresApproval,
} from "../src/index";
import { fakeEmbed } from "./fake-embed";

describe("registry and approval", () => {
  it("registers every core operation once", () => {
    registerOperations({ operations: createCoreOperations({ embed: fakeEmbed }) });
    registerOperations({ operations: [createVenue] });
    expect(listOperations().map((op) => op.name)).toEqual([
      "room.archive",
      "room.create",
      "room.get",
      "room.list",
      "room.update",
      "search",
      "venue.archive",
      "venue.create",
      "venue.get",
      "venue.list",
      "venue.update",
    ]);
    expect(getOperation({ name: "venue.create" })).toBe(createVenue);
  });

  it("requires approval only for AI-run commands", () => {
    const ai = { type: "ai", userId: "u1" } as const;
    expect(requiresApproval({ operation: createVenue, actor: ai })).toBe(true);
    expect(requiresApproval({ operation: listVenues, actor: ai })).toBe(false);
    const user = { type: "user", userId: "u1" } as const;
    expect(requiresApproval({ operation: createVenue, actor: user })).toBe(false);
  });
});
