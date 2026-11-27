import { describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "./turnstile";

const ORIGIN = "https://challenges.test";

function answering({ status = 200, body }: { status?: number; body: unknown }) {
  return vi.fn<typeof fetch>(async () => Response.json(body, { status }));
}

describe("verifyTurnstile", () => {
  it("posts the secret, token and IP to siteverify and passes on success", async () => {
    const fetcher = answering({ body: { success: true } });
    const passed = await verifyTurnstile({
      ...{ token: "tok", secret: "sec", origin: ORIGIN, ip: "1.2.3.4", fetcher },
    });
    expect(passed).toBe(true);
    const [url, init] = fetcher.mock.calls[0] ?? [];
    expect(url).toBe(`${ORIGIN}/turnstile/v0/siteverify`);
    const sent = new URLSearchParams(String(init?.body));
    expect(Object.fromEntries(sent)).toEqual({
      secret: "sec",
      response: "tok",
      remoteip: "1.2.3.4",
    });
  });

  it("fails on a refused token, an error status, a network error or no token", async () => {
    const base = { secret: "sec", origin: ORIGIN, ip: null };
    const refused = answering({ body: { success: false, "error-codes": ["invalid-input"] } });
    expect(await verifyTurnstile({ ...base, token: "tok", fetcher: refused })).toBe(false);
    const down = answering({ status: 500, body: {} });
    expect(await verifyTurnstile({ ...base, token: "tok", fetcher: down })).toBe(false);
    const offline = vi.fn<typeof fetch>(async () => {
      throw new Error("offline");
    });
    expect(await verifyTurnstile({ ...base, token: "tok", fetcher: offline })).toBe(false);
    const unused = answering({ body: { success: true } });
    expect(await verifyTurnstile({ ...base, token: "", fetcher: unused })).toBe(false);
    expect(unused).not.toHaveBeenCalled();
  });
});
