import { describe, expect, it } from "vitest";
import { call, newOrgId } from "./helpers";

describe("error mapping", () => {
  it("returns 401 without credentials", async () => {
    const result = await call({ path: "/venues" });
    expect(result.status).toBe(401);
    expect(result.json.error).toMatchObject({ code: "UNAUTHENTICATED", issues: [] });
  });

  it("returns 400 with issues for invalid body and invalid query", async () => {
    const org = newOrgId();
    const body = await call({ method: "POST", path: "/venues", org, body: { name: "" } });
    expect(body.status).toBe(400);
    expect(body.json.error.code).toBe("VALIDATION");
    expect(body.json.error.issues[0].path).toBe("name");
    const query = await call({ path: "/venues?limit=abc", org });
    expect(query.status).toBe(400);
    const broken = await call({ method: "POST", path: "/venues", org, body: "{nope" });
    expect(broken.status).toBe(400);
    const array = await call({ method: "POST", path: "/venues", org, body: [] });
    expect(array.status).toBe(400);
  });

  it("returns 404 for missing entities and unknown routes", async () => {
    const org = newOrgId();
    const missing = await call({ path: "/venues/does-not-exist", org });
    expect(missing.status).toBe(404);
    expect(missing.json.error.code).toBe("NOT_FOUND");
    const route = await call({ path: "/nothing-here", org });
    expect(route.status).toBe(404);
    const method = await call({ method: "PUT", path: "/venues", org });
    expect(method.status).toBe(404);
  });

  it("returns 403 when the role lacks permission", async () => {
    const org = newOrgId();
    const forbidden = await call({
      method: "POST",
      path: "/venues",
      org,
      access: "none",
      body: { name: "X" },
    });
    expect(forbidden.status).toBe(403);
  });

  it("does not let the body override path params", async () => {
    const org = newOrgId();
    const venue = await call({ method: "POST", path: "/venues", org, body: { name: "V" } });
    const other = await call({ method: "POST", path: "/venues", org, body: { name: "W" } });
    const patched = await call({
      method: "PATCH",
      path: `/venues/${venue.json.id}`,
      org,
      body: { id: other.json.id, name: "V2" },
    });
    expect(patched.json.id).toBe(venue.json.id);
  });
});
