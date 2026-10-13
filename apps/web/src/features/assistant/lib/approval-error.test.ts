import { describe, expect, it } from "vitest";
import { approvalErrorKey } from "./approval-error";

describe("approvalErrorKey", () => {
  it.each([
    [409, "approvalUsed"],
    [403, "approvalExpired"],
    [401, "unauthorized"],
    [404, "notFound"],
    [500, "generic"],
    [null, "network"],
  ] as const)("maps %s to %s", (status, key) => {
    expect(approvalErrorKey({ status })).toBe(key);
  });
});
