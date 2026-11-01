import { describe, expect, it } from "vitest";
import { urlHost } from "./url-host";

describe("urlHost", () => {
  it("gives the host of an absolute URL", () => {
    expect(urlHost({ value: "https://claude.ai/api/mcp/auth_callback" })).toBe("claude.ai");
    expect(urlHost({ value: "http://127.0.0.1:61000/callback" })).toBe("127.0.0.1:61000");
  });

  it("gives null for a missing or relative value", () => {
    expect(urlHost({ value: null })).toBeNull();
    expect(urlHost({ value: "my-client-id" })).toBeNull();
  });
});
