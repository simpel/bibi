import { APP_ERROR_CODES } from "@bibi/core";
import messages from "@bibi/i18n/messages/sv.json";
import { describe, expect, it } from "vitest";
import { errorKeyForCode } from "./error-key";

describe("errorKeyForCode", () => {
  it("maps every AppError code to an existing errors.* message", () => {
    for (const code of APP_ERROR_CODES) {
      expect(Object.keys(messages.errors)).toContain(errorKeyForCode({ code }));
    }
  });

  it("maps the common codes", () => {
    expect(errorKeyForCode({ code: "NOT_FOUND" })).toBe("notFound");
    expect(errorKeyForCode({ code: "UNAUTHENTICATED" })).toBe("unauthorized");
    expect(errorKeyForCode({ code: "INTERNAL" })).toBe("generic");
  });
});
