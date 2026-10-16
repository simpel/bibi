import { describe, expect, it } from "vitest";
import { formatDevBanner } from "./dev-banner";

describe("formatDevBanner", () => {
  it("lists every service with its url and note", () => {
    const banner = formatDevBanner({
      services: [{ name: "Mailpit", url: "http://localhost:8025", note: "Inbox" }],
    });
    expect(banner).toContain("Mailpit    http://localhost:8025");
    expect(banner).toContain("Inbox");
  });
});
