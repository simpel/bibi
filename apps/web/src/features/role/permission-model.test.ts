import { describe, expect, it } from "vitest";
import { hasAction, MATRIX_RESOURCES, toggleAction } from "./permission-model";

describe("permission model", () => {
  it("lists the schema's resources", () => {
    expect(MATRIX_RESOURCES).toContain("venue");
    expect(MATRIX_RESOURCES).toContain("role");
  });

  it("checking admin grants write and read", () => {
    const next = toggleAction({
      permissions: {},
      resource: "venue",
      action: "admin",
      checked: true,
    });
    expect(next.venue).toEqual(["read", "write", "admin"]);
  });

  it("unchecking read clears the resource", () => {
    const next = toggleAction({
      permissions: { room: ["read", "write"] },
      resource: "room",
      action: "read",
      checked: false,
    });
    expect(next.room).toBeUndefined();
  });

  it("unchecking write keeps read", () => {
    const next = toggleAction({
      permissions: { room: ["read", "write", "admin"] },
      resource: "room",
      action: "write",
      checked: false,
    });
    expect(hasAction({ permissions: next, resource: "room", action: "read" })).toBe(true);
    expect(hasAction({ permissions: next, resource: "room", action: "write" })).toBe(false);
  });
});
