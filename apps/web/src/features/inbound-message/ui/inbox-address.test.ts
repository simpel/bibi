import { ok } from "@bibi/core";
import { Alert } from "@bibi/ui";
import { describe, expect, it, vi } from "vitest";

const mockRunOperation = vi.fn();
vi.mock("@/server/run-operation", () => ({
  runOperation: (...args: unknown[]) => mockRunOperation(...args),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async () => {
    const t = (key: string) => key;
    t.rich = (_key: string, values: { address: string }) => `Forward mail to ${values.address}`;
    return t;
  },
}));

const { InboxAddress } = await import("./inbox-address");

describe("InboxAddress", () => {
  it("renders address text when an active email endpoint exists", async () => {
    mockRunOperation.mockResolvedValueOnce(
      ok({
        value: {
          items: [{ active: true, address: "demo@in.heybibi.se", channel: "EMAIL" }],
        },
      }),
    );
    const element = await InboxAddress({ isAdmin: false });
    expect(element).not.toBeNull();
    expect(element?.type).toBe("p");
  });

  it("returns null when no address is configured and caller is not admin", async () => {
    mockRunOperation.mockResolvedValueOnce(
      ok({
        value: { items: [] },
      }),
    );
    const element = await InboxAddress({ isAdmin: false });
    expect(element).toBeNull();
  });

  it("renders an alert with a link to settings when no address is configured and caller is admin", async () => {
    mockRunOperation.mockResolvedValueOnce(
      ok({
        value: { items: [] },
      }),
    );
    const element = await InboxAddress({ isAdmin: true });
    expect(element).not.toBeNull();
    expect(element?.type).toBe(Alert);
  });
});
