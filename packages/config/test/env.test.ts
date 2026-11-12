import { describe, expect, it } from "vitest";
import { parseEnv } from "../src/env";

const base = {
  DATABASE_URL: "postgresql://bibi:bibi@localhost:5432/bibi",
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3330",
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

  it("serves MCP from the web app's URL unless MCP_ORIGIN names its own host", () => {
    const web = { ...base, WEB_ORIGIN: "https://app.heybibi.se" };
    expect(parseEnv({ source: web }).MCP_ORIGIN).toBe("https://app.heybibi.se");
    expect(parseEnv({ source: { ...web, MCP_ORIGIN: "" } }).MCP_ORIGIN).toBe("https://app.heybibi.se");
    expect(parseEnv({ source: { ...web, MCP_ORIGIN: "https://mcp.heybibi.se" } }).MCP_ORIGIN).toBe(
      "https://mcp.heybibi.se",
    );
  });

  it("leaves PUBLIC_ORIGIN unset unless a URL is given", () => {
    expect(parseEnv({ source: base }).PUBLIC_ORIGIN).toBeUndefined();
    expect(parseEnv({ source: { ...base, PUBLIC_ORIGIN: "" } }).PUBLIC_ORIGIN).toBeUndefined();
    expect(parseEnv({ source: { ...base, PUBLIC_ORIGIN: "https://heybibi.se" } }).PUBLIC_ORIGIN).toBe(
      "https://heybibi.se",
    );
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

describe("parseEnv storage", () => {
  it("defaults to the disk driver", () => {
    const env = parseEnv({ source: base });
    expect(env.STORAGE_DRIVER).toBe("disk");
    expect(env.STORAGE_DISK_DIR).toBe("./.storage");
  });

  it("requires the S3 settings when STORAGE_DRIVER=s3", () => {
    expect(() => parseEnv({ source: { ...base, STORAGE_DRIVER: "s3" } })).toThrow(/S3_BUCKET/);
  });
  it("rejects an origin with a path or trailing slash", () => {
    for (const value of ["https://mcp.heybibi.se/mcp", "https://app.heybibi.se/"]) {
      expect(() => parseEnv({ source: { ...base, MCP_ORIGIN: value } })).toThrow();
      expect(() => parseEnv({ source: { ...base, WEB_ORIGIN: value } })).toThrow();
    }
  });
});
