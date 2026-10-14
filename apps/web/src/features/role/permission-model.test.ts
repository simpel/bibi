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
      permissions: { item: ["read", "write"] },
      resource: "item",
      action: "read",
      checked: false,
    });
    expect(next.item).toBeUndefined();
  });

  it("unchecking write keeps read", () => {
    const next = toggleAction({
      permissions: { item: ["read", "write", "admin"] },
      resource: "item",
      action: "write",
      checked: false,
    });
    expect(hasAction({ permissions: next, resource: "item", action: "read" })).toBe(true);
    expect(hasAction({ permissions: next, resource: "item", action: "write" })).toBe(false);
  });
});
