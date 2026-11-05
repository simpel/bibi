import { describe, expect, it } from "vitest";
import { entityTitle } from "./page-metadata";

describe("entityTitle", () => {
  it("uses the entity name when present", () => {
    expect(entityTitle({ name: "Acme Corp" })).toEqual({ title: "Acme Corp" });
  });

  it("falls back to fallback or Details", () => {
    expect(entityTitle({ name: "   " })).toEqual({ title: "Details" });
    expect(entityTitle({ name: null, fallback: "Customer" })).toEqual({ title: "Customer" });
  });

  it("includes prefix when provided", () => {
    expect(entityTitle({ name: "Acme Corp", prefix: "Edit" })).toEqual({
      title: "Edit · Acme Corp",
    });
  });
});
