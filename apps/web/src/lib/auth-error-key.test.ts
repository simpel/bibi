import messages from "@okazi/i18n/messages/sv.json";
import { describe, expect, it } from "vitest";
import { authErrorKey } from "./auth-error-key";

describe("authErrorKey", () => {
  it("maps Better Auth codes", () => {
    expect(authErrorKey({ error: { code: "INVALID_EMAIL_OR_PASSWORD", status: 401 } })).toBe(
      "invalidCredentials",
    );
    expect(authErrorKey({ error: { code: "USER_ALREADY_EXISTS", status: 422 } })).toBe(
      "emailTaken",
    );
  });

  it("falls back to the HTTP status, then to generic", () => {
    expect(authErrorKey({ error: { status: 429 } })).toBe("tooManyRequests");
    expect(authErrorKey({ error: { code: "WHAT", status: 500 } })).toBe("generic");
    expect(authErrorKey({ error: null })).toBe("generic");
  });

  it("only returns keys that exist in errors.*", () => {
    const codes = ["INVALID_OTP", "PASSWORD_TOO_SHORT", "INVITATION_NOT_FOUND", "OTP_EXPIRED"];
    for (const code of codes) {
      expect(Object.keys(messages.errors)).toContain(authErrorKey({ error: { code } }));
    }
  });
});
