import { describe, expect, it } from "vitest";
import { setupFormDefaults, setupFormSchema, setupFormToInput } from "./setup-form-schema";

describe("setup form schema", () => {
  it("maps the changeover time to a number", () => {
    const values = { name: " Bio ", changeoverMinutes: "15" };
    expect(setupFormToInput({ values })).toEqual({ name: "Bio", changeoverMinutes: 15 });
  });

  it("validates with core's setup schema", () => {
    expect(setupFormSchema.safeParse(setupFormDefaults({})).success).toBe(false);
    const ok = setupFormSchema.safeParse({ name: "Bio", changeoverMinutes: "0" });
    expect(ok.success).toBe(true);
  });
});
