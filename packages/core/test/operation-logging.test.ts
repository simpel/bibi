import { type CapturedLogs, captureLogs, runWithLogContext } from "@okazi/logger";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createVenue, defineOperation, execute, listVenues, updateVenue } from "../src/index";
import { testContext } from "./helpers";

let logs: CapturedLogs;

beforeEach(() => {
  logs = captureLogs();
});

afterEach(() => logs.restore());

const crashing = defineOperation({
  name: "test.crash",
  kind: "query",
  description: "Throws",
  input: createVenue.input,
  output: createVenue.output,
  permission: "venue:read",
  handler: async () => {
    throw new Error("kaboom");
  },
});

describe("operation logging (ADR 0014)", () => {
  it("logs one completed line per command and query, without payloads", async () => {
    const context = testContext();
    await execute({ operation: createVenue, input: { name: "Secret Name" }, context });
    await execute({ operation: listVenues, input: {}, context });
    const lines = logs.events({ event: "operation.completed" });
    expect(lines.map((line) => [line.operation, line.kind, line.level])).toEqual([
      ["venue.create", "command", "info"],
      ["venue.list", "query", "info"],
    ]);
    expect(lines[0]).toMatchObject({ organizationId: context.organizationId, actorType: "user" });
    expect(typeof lines[0]?.durationMs).toBe("number");
    expect(JSON.stringify(logs.entries())).not.toContain("Secret Name");
  });

  it("logs validation, permission and not-found as rejected", async () => {
    const context = testContext();
    const member = testContext({ permissions: {} });
    await execute({ operation: createVenue, input: { name: "" }, context });
    await execute({ operation: createVenue, input: { name: "X" }, context: member });
    await execute({ operation: updateVenue, input: { id: "missing", name: "X" }, context });
    const rejected = logs.events({ event: "operation.rejected" });
    expect(rejected.map((line) => [line.errorCode, line.level])).toEqual([
      ["VALIDATION", "warn"],
      ["FORBIDDEN", "warn"],
      ["NOT_FOUND", "warn"],
    ]);
    expect(rejected[0]?.issuePaths).toEqual(["name"]);
  });

  it("logs internal errors as failed, with the cause", async () => {
    const result = await execute({
      operation: crashing,
      input: { name: "X" },
      context: testContext(),
    });
    expect(result.ok).toBe(false);
    const [failed] = logs.events({ event: "operation.failed" });
    expect(failed?.level).toBe("error");
    expect(JSON.stringify(failed?.err)).toContain("kaboom");
  });

  it("logs failing afterCommit hooks without failing the command", async () => {
    const hook = async () => {
      throw new Error("index down");
    };
    const result = await execute({
      operation: createVenue,
      input: { name: "Hooked" },
      context: testContext(),
      afterCommit: [hook, async () => undefined],
    });
    expect(result.ok).toBe(true);
    const failures = logs.events({ event: "operation.afterCommitFailed" });
    expect(failures).toHaveLength(1);
    expect(failures[0]?.operation).toBe("venue.create");
  });

  it("stamps requestId and surface on log lines and audit rows", async () => {
    const context = testContext();
    await runWithLogContext({
      context: { requestId: "req-audit-1", surface: "rest" },
      fn: () => execute({ operation: createVenue, input: { name: "Traced" }, context }),
    });
    const [line] = logs.events({ event: "operation.completed" });
    expect(line).toMatchObject({ requestId: "req-audit-1", surface: "rest" });
    const [row] = await context.db.auditLog.findMany();
    expect(row).toMatchObject({ requestId: "req-audit-1", surface: "rest" });
  });

  it("defaults audit rows outside a request to surface system", async () => {
    const context = testContext();
    await execute({ operation: createVenue, input: { name: "Background" }, context });
    const [row] = await context.db.auditLog.findMany();
    expect(row).toMatchObject({ requestId: null, surface: "system" });
  });
});
