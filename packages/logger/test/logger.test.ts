import { describe, expect, it } from "vitest";
import {
  addToLogContext,
  captureLogs,
  createMemoryLogger,
  maskEmail,
  requestIdFrom,
  runWithLogContext,
} from "../src/index";

describe("logger", () => {
  it("writes structured events with level label, service and msg defaulting to event", () => {
    const { logger, entries } = createMemoryLogger();
    logger.info({ event: "thing.happened", count: 2 });
    expect(entries()[0]).toMatchObject({
      level: "info",
      service: "test",
      event: "thing.happened",
      msg: "thing.happened",
      count: 2,
    });
  });

  it("stamps the request context on every line, including fields added later", async () => {
    const { logger, entries } = createMemoryLogger();
    await runWithLogContext({
      context: { requestId: "req-12345678", surface: "rest" },
      fn: async () => {
        await Promise.resolve();
        addToLogContext({ fields: { organizationId: "org_1", userId: "user_1" } });
        logger.info({ event: "inside" });
      },
    });
    logger.info({ event: "outside" });
    const [inside, outside] = entries();
    expect(inside).toMatchObject({ requestId: "req-12345678", surface: "rest", userId: "user_1" });
    expect(outside?.requestId).toBeUndefined();
  });

  it("redacts secrets at the top level and nested", () => {
    const { logger, entries } = createMemoryLogger();
    logger.info({
      event: "leak.attempt",
      password: "hunter22",
      headers: { authorization: "Bearer x", "x-api-key": "bib_1" },
      deep: { body: { token: "t" } },
    });
    expect(entries()[0]).toMatchObject({
      password: "[redacted]",
      headers: { authorization: "[redacted]", "x-api-key": "[redacted]" },
      deep: { body: { token: "[redacted]" } },
    });
  });

  it("serializes errors with stack and cause", () => {
    const { logger, entries } = createMemoryLogger();
    const cause = new Error("db down");
    logger.error({ event: "boom", err: new Error("wrapped", { cause }) });
    const err = entries()[0]?.err as { message: string; stack: string; cause: { message: string } };
    expect(err.message).toBe("wrapped");
    expect(err.stack).toContain("Error: wrapped");
    expect(err.cause.message).toBe("db down");
  });

  it("captureLogs routes the process logger into memory", async () => {
    const logs = captureLogs();
    const { getLogger } = await import("../src/index");
    getLogger().warn({ event: "captured" });
    logs.restore();
    expect(logs.events({ event: "captured" })).toHaveLength(1);
  });
});

describe("requestIdFrom", () => {
  it("reuses a valid incoming id and replaces an unsafe one", () => {
    const valid = new Headers({ "x-request-id": "abc-123_456.789" });
    expect(requestIdFrom({ headers: valid })).toBe("abc-123_456.789");
    const unsafe = new Headers({ "x-request-id": 'bad id {"level":"info"}' });
    expect(requestIdFrom({ headers: unsafe })).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("maskEmail", () => {
  it("keeps only the domain", () => {
    expect(maskEmail({ email: "anna@volvo.se" })).toBe("***@volvo.se");
  });
});
