import { describe, expect, it } from "vitest";
import { shouldUseMockModel } from "./mock-model-policy";

describe("shouldUseMockModel", () => {
  it("is off by default and in production, even when the flag is set", () => {
    expect(shouldUseMockModel({ flag: false, nodeEnv: "test" })).toBe(false);
    expect(shouldUseMockModel({ flag: true, nodeEnv: "production" })).toBe(false);
  });

  it("is on only for the flag outside production", () => {
    expect(shouldUseMockModel({ flag: true, nodeEnv: "test" })).toBe(true);
    expect(shouldUseMockModel({ flag: true, nodeEnv: "development" })).toBe(true);
  });
});
