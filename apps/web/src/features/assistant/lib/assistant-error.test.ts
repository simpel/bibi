import { describe, expect, it } from "vitest";
import { assistantErrorKey } from "./assistant-error";

describe("assistantErrorKey", () => {
  it("maps the JSON error body of the chat route by AppError code", () => {
    const body = JSON.stringify({ error: { code: "UNAUTHENTICATED", message: "x" } });
    expect(assistantErrorKey({ error: new Error(body) })).toBe("unauthorized");
    const forbidden = JSON.stringify({ error: { code: "FORBIDDEN", message: "x" } });
    expect(assistantErrorKey({ error: new Error(forbidden) })).toBe("forbidden");
  });

  it("treats fetch failures as network errors", () => {
    expect(assistantErrorKey({ error: new TypeError("Failed to fetch") })).toBe("network");
  });

  it("falls back to generic for stream errors and unknown bodies", () => {
    const message = "The assistant could not finish the answer. Please try again.";
    expect(assistantErrorKey({ error: new Error(message) })).toBe("generic");
    expect(assistantErrorKey({ error: new Error('{"error":{"code":"WAT"}}') })).toBe("generic");
  });
});
