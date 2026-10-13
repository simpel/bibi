import { describe, expect, it } from "vitest";
import { roomFormDefaults, roomFormSchema, roomFormToInput } from "./room-form-schema";

const base = { ...roomFormDefaults({ venueId: "v1" }), name: "Salongen" };

describe("room form schema", () => {
  it("maps blank numbers to null and keeps the venue id", () => {
    const input = roomFormToInput({ values: { ...base, maxCapacity: "40", areaSqm: "" } });
    expect(input).toMatchObject({ venueId: "v1", maxCapacity: 40, areaSqm: null });
  });

  it("validates with core's room schema", () => {
    expect(roomFormSchema.safeParse(base).success).toBe(true);
    const bad = roomFormSchema.safeParse({ ...base, maxCapacity: "-3", name: "" });
    expect(bad.success).toBe(false);
    const paths = bad.error?.issues.map((issue) => issue.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["maxCapacity", "name"]));
  });
});
