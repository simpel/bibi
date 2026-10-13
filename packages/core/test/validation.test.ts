import { describe, expect, it } from "vitest";
import {
  AppError,
  createVenue,
  execute,
  listVenues,
  toGraphqlExtensions,
  toHttpStatus,
  toMcpError,
} from "../src/index";
import { testContext } from "./helpers";

describe("validation and authorization", () => {
  it("returns VALIDATION with field issues for bad input", async () => {
    const result = await execute({
      operation: createVenue,
      input: { name: "" },
      context: testContext(),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("VALIDATION");
    expect(result.error.issues.map((issue) => issue.path)).toContain("name");
  });

  it("returns FORBIDDEN when the role lacks the permission", async () => {
    const context = testContext({ roles: ["viewer"] });
    const write = await execute({ operation: createVenue, input: { name: "X" }, context });
    expect(write.ok ? null : write.error.code).toBe("FORBIDDEN");
    const read = await execute({ operation: listVenues, input: {}, context });
    expect(read.ok).toBe(true);
  });

  it("returns UNAUTHENTICATED for a user actor without user id", async () => {
    const context = testContext({ actor: { type: "user", userId: null } });
    const result = await execute({ operation: listVenues, input: {}, context });
    expect(result.ok ? null : result.error.code).toBe("UNAUTHENTICATED");
  });

  it("maps errors identically for every surface", () => {
    const error = new AppError({
      code: "VALIDATION",
      message: "Invalid input",
      issues: [{ path: "name", message: "Required" }],
    });
    expect(toHttpStatus({ error })).toBe(400);
    expect(toGraphqlExtensions({ error })).toMatchObject({ code: "VALIDATION", httpStatus: 400 });
    const mcp = toMcpError({ error });
    expect(mcp.isError).toBe(true);
    expect(mcp.content[0]?.text).toContain("name: Required");
  });
});
