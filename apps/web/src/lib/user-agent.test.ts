import { describe, expect, it } from "vitest";
import { describeUserAgent } from "./user-agent";

const MAC_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36";
const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const WINDOWS_EDGE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0";

describe("describeUserAgent", () => {
  it("names the browser and system", () => {
    expect(describeUserAgent({ userAgent: MAC_CHROME })).toEqual({
      browser: "Chrome",
      os: "macOS",
    });
    expect(describeUserAgent({ userAgent: IPHONE_SAFARI })).toEqual({
      browser: "Safari",
      os: "iOS",
    });
    expect(describeUserAgent({ userAgent: WINDOWS_EDGE })).toEqual({
      browser: "Edge",
      os: "Windows",
    });
  });

  it("gives nulls for an unknown or missing agent", () => {
    expect(describeUserAgent({ userAgent: null })).toEqual({ browser: null, os: null });
    expect(describeUserAgent({ userAgent: "curl/8.0" })).toEqual({ browser: null, os: null });
  });
});
