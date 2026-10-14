import { createSystemLogSink, getDb } from "@okazi/db";
import { createLogger } from "@okazi/logger";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";

describe("SystemLog sink (ADR 0015)", () => {
  it("persists logger lines with indexed columns and the full redacted line", async () => {
    const sink = createSystemLogSink({ retentionDays: 30, flushIntervalMs: 60_000 });
    const logger = createLogger({ level: "info", service: "test", destination: sink });
    const requestId = `req-${createId()}`;
    logger.warn({
      event: "operation.rejected",
      requestId,
      operation: "venue.create",
      errorCode: "VALIDATION",
      durationMs: 1.5,
      password: "hunter22",
    });
    logger.debug({ event: "too.quiet", requestId });
    await sink.flush();
    const rows = await getDb().systemLog.findMany({ where: { requestId } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      level: "warn",
      event: "operation.rejected",
      service: "test",
      operation: "venue.create",
      errorCode: "VALIDATION",
      durationMs: 1.5,
    });
    expect(rows[0]?.data).toMatchObject({ password: "[redacted]" });
  });

  it("survives unparseable lines", async () => {
    const sink = createSystemLogSink({ retentionDays: 30, flushIntervalMs: 60_000 });
    expect(() => sink.write("not json\n")).not.toThrow();
    await expect(sink.flush()).resolves.toBeUndefined();
  });
});
