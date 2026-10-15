import { describe, expect, it, vi } from "vitest";
import { createBetterStackSink } from "../src/index";

describe("better stack sink", () => {
  it("posts buffered lines as one batch with bearer auth and an ISO dt", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    const sink = createBetterStackSink({ host: "s1.example.com", token: "tok", fetchImpl });
    sink.write(JSON.stringify({ time: 0, level: "info", event: "a.b" }));
    sink.write("not json");
    await sink.flush();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://s1.example.com");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer tok");
    expect(JSON.parse(init.body as string)).toEqual([
      { dt: "1970-01-01T00:00:00.000Z", level: "info", event: "a.b" },
    ]);
  });

  it("swallows delivery failures and sends nothing when empty", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("down"));
    const sink = createBetterStackSink({ host: "h", token: "t", fetchImpl });
    await sink.flush();
    expect(fetchImpl).not.toHaveBeenCalled();
    sink.write(JSON.stringify({ event: "x" }));
    await expect(sink.flush()).resolves.toBeUndefined();
  });
});
