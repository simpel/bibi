import { describe, expect, it } from "vitest";
import { call, newOrgId } from "./helpers";

const path = "/configuration/import-template";
const body = { template: "conference-venue" };

describe("configuration template over HTTP", () => {
  it("imports the starter pack into an empty organization, then skips everything", async () => {
    const org = newOrgId();
    const first = await call({ method: "POST", path, org, body });
    expect(first.status).toBe(201);
    expect(first.json.created.entityTypes.length).toBeGreaterThan(0);
    const types = await call({ path: "/entity-types?limit=100", org });
    expect(types.json.items).toHaveLength(first.json.created.entityTypes.length);
    const again = await call({ method: "POST", path, org, body });
    expect(again.json.created.entityTypes).toEqual([]);
    expect(again.json.skipped.entityTypes).toHaveLength(first.json.created.entityTypes.length);
  });
});
