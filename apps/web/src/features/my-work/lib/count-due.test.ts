import { describe, expect, it } from "vitest";
import { countDue } from "./count-due";

describe("countDue", () => {
  it("counts blocked, late and today, never soon or waiting", () => {
    const groups = ["BLOCKED", "LATE", "TODAY", "SOON", "WAITING", "LATE"] as const;
    expect(countDue({ tasks: groups.map((group) => ({ group })) })).toBe(4);
  });

  it("is null without tasks to read", () => {
    expect(countDue({ tasks: null })).toBeNull();
  });
});
