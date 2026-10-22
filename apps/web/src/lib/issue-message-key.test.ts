import messages from "@bibi/i18n/messages/sv.json";
import { describe, expect, it } from "vitest";
import { issueMessageKey } from "./issue-message-key";

describe("issueMessageKey", () => {
  it("treats an empty required string as required", () => {
    expect(issueMessageKey({ code: "too_small", origin: "string", minimum: 1 })).toBe("required");
  });

  it("distinguishes short text, numbers and emails", () => {
    expect(issueMessageKey({ code: "too_small", origin: "string", minimum: 10 })).toBe(
      "textTooShort",
    );
    expect(issueMessageKey({ code: "too_small", origin: "number" })).toBe("tooShort");
    expect(issueMessageKey({ code: "invalid_format", format: "email" })).toBe("invalidEmail");
    expect(issueMessageKey({ code: "invalid_type", expected: "number" })).toBe("invalidNumber");
    expect(issueMessageKey({ code: "too_big", origin: "string" })).toBe("tooLong");
    expect(issueMessageKey({ code: "custom" })).toBe("invalid");
  });

  it("only returns keys that exist in errors.*", () => {
    const facts = [
      { code: "too_small", origin: "string", minimum: 1 },
      { code: "too_small", origin: "string", minimum: 5 },
      { code: "too_small", origin: "number" },
      { code: "too_big", origin: "string" },
      { code: "too_big", origin: "number" },
      { code: "invalid_type", expected: "number" },
      { code: "invalid_type", expected: "string" },
      { code: "invalid_format", format: "email" },
      { code: "other" },
    ];
    for (const fact of facts) {
      expect(Object.keys(messages.errors)).toContain(issueMessageKey(fact));
    }
  });
});
