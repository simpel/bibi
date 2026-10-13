import { describe, expect, it } from "vitest";
import { call, newOrgId } from "./helpers";

describe("organization isolation", () => {
  it("hides, and refuses to change, another organization's data", async () => {
    const [a, b] = [newOrgId(), newOrgId()];
    const venue = await call({ method: "POST", path: "/venues", org: a, body: { name: "Secret" } });
    const id = venue.json.id as string;
    expect((await call({ path: `/venues/${id}`, org: b })).status).toBe(404);
    expect((await call({ path: "/venues", org: b })).json.items).toEqual([]);
    const patch = await call({
      method: "PATCH",
      path: `/venues/${id}`,
      org: b,
      body: { name: "x" },
    });
    expect(patch.status).toBe(404);
    expect((await call({ method: "DELETE", path: `/venues/${id}`, org: b })).status).toBe(404);
    expect((await call({ path: `/venues/${id}`, org: a })).json.status).toBe("ACTIVE");
  });
});
