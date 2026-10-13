import { describe, expect, it } from "vitest";
import { statementsForRole } from "../src/index";
import { capRole, highestRole, parseRoles, roleForKeyPermissions } from "../src/roles";

describe("permission mapping", () => {
  it("derives Better Auth statements from core role semantics", () => {
    expect(statementsForRole({ role: "viewer" }).venue).toEqual(["read"]);
    expect(statementsForRole({ role: "member" }).room).toEqual(["read", "write"]);
    expect(statementsForRole({ role: "owner" }).search).toEqual(["read", "write", "admin"]);
  });

  it("parses comma-separated member roles and drops unknown ones", () => {
    expect(parseRoles({ role: "admin, member,hacker" })).toEqual(["admin", "member"]);
    expect(highestRole({ roles: ["member", "admin"] })).toBe("admin");
    expect(highestRole({ roles: [] })).toBeNull();
  });

  it("caps roles and maps key permissions to the largest fully covered role", () => {
    expect(capRole({ role: "owner", cap: "member" })).toBe("member");
    expect(capRole({ role: "viewer", cap: "admin" })).toBe("viewer");
    const member = statementsForRole({ role: "member" });
    expect(roleForKeyPermissions({ permissions: member })).toBe("member");
    expect(roleForKeyPermissions({ permissions: { venue: ["read", "write"] } })).toBeNull();
    expect(roleForKeyPermissions({ permissions: null })).toBeNull();
  });
});
