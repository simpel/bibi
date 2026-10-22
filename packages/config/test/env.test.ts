import { describe, expect, it } from "vitest";
import { parseEnv } from "../src/env";

const base = {
  DATABASE_URL: "postgresql://bibi:bibi@localhost:5432/bibi",
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
};

describe("parseEnv", () => {
  it("falls back to the defaults when SMTP_URL and MAIL_FROM are unset", () => {
    const env = parseEnv({ source: base });
    expect(env.SMTP_URL).toBe("smtp://localhost:1025");
    expect(env.MAIL_FROM).toBe("Bibi <no-reply@bibi.local>");
  });

  it("treats empty SMTP_URL and MAIL_FROM as unset", () => {
    const env = parseEnv({ source: { ...base, SMTP_URL: "", MAIL_FROM: "" } });
    expect(env.SMTP_URL).toBe("smtp://localhost:1025");
    expect(env.MAIL_FROM).toBe("Bibi <no-reply@bibi.local>");
  });

  it("treats empty optional and defaulted vars as unset", () => {
    const env = parseEnv({
      source: { ...base, MAIL_PROVIDER: "", MAIL_INBOUND_DOMAIN: "", WEB_OAUTH_CLIENT_ID: "" },
    });
    expect(env.MAIL_PROVIDER).toBe("smtp");
    expect(env.MAIL_INBOUND_DOMAIN).toBeUndefined();
    expect(env.WEB_OAUTH_CLIENT_ID).toBeUndefined();
  });

  it("keeps explicit values and still requires the Resend key", () => {
    expect(parseEnv({ source: { ...base, SMTP_URL: "smtp://mail:25" } }).SMTP_URL).toBe(
      "smtp://mail:25",
    );
    expect(() =>
      parseEnv({ source: { ...base, MAIL_PROVIDER: "resend", RESEND_API_KEY: "" } }),
    ).toThrow();
  });
});
