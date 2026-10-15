import { getEnv } from "@okazi/config";
import { describe, expect, it } from "vitest";
import { providerFromEnv } from "../src/index";

describe("providerFromEnv", () => {
  it("selects SMTP by default", () => {
    expect(providerFromEnv({ env: { ...getEnv(), MAIL_PROVIDER: "smtp" } }).name).toBe("smtp");
  });

  it("selects Resend when MAIL_PROVIDER=resend", () => {
    const env = { ...getEnv(), MAIL_PROVIDER: "resend" as const, RESEND_API_KEY: "re_key" };
    expect(providerFromEnv({ env }).name).toBe("resend");
  });
});
