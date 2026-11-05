import { describe, expect, it } from "vitest";
import { buildLogQuery } from "./log-query";

const mockMessages = {
  admin: {
    logs: {
      query: {
        keys: {
          level: "level",
          type: "type",
          surface: "surface",
          requestId: "request",
          operation: "operation",
          status: "status",
        },
        values: {
          trace: "trace",
          debug: "debug",
          info: "info",
          warn: "warn",
          error: "error",
          fatal: "fatal",
          web: "web",
          graphql: "graphql",
          rest: "rest",
          mcp: "mcp",
          ai: "ai",
          auth: "auth",
          cli: "cli",
          system: "system",
          webhook: "webhook",
        },
        labels: {
          level: "Level",
          type: "Type",
          surface: "Surface",
          requestId: "Request ID",
          operation: "Operation",
          status: "Status",
        },
        hints: {
          level: "level hint",
          type: "type hint",
          surface: "surface hint",
          requestId: "request hint",
          operation: "op hint",
          status: "status hint",
        },
      },
    },
  },
} as unknown as Parameters<typeof buildLogQuery>[0]["messages"];

describe("buildLogQuery", () => {
  it("builds vocabulary with level, type and surface qualifiers", () => {
    const { vocabulary, texts } = buildLogQuery({ messages: mockMessages });
    expect(vocabulary.qualifiers).toContain("level");
    expect(vocabulary.qualifiers).toContain("type");
    expect(vocabulary.qualifiers).toContain("surface");
    expect(vocabulary.fixed.level).toContain("error");
    expect(vocabulary.fixed.type).toContain("error");
    expect(vocabulary.fixed.surface).toContain("web");
    expect(texts.labels.level).toBe("Level");
    expect(texts.labels.type).toBe("Type");
  });
});
