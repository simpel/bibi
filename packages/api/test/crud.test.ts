import { describe, expect, it } from "vitest";
import { call, newOrgId } from "./helpers";

describe("venue + room CRUD over HTTP", () => {
  it("creates, reads, updates, lists and archives venue and rooms", async () => {
    const org = newOrgId();
    const created = await call({ method: "POST", path: "/venues", org, body: { name: "Volvo" } });
    expect(created.status).toBe(201);
    const venueId = created.json.id as string;
    expect(created.json.organizationId).toBe(org);

    const room = await call({
      method: "POST",
      path: `/venues/${venueId}/rooms`,
      org,
      body: { name: "Hall A", maxCapacity: 40 },
    });
    expect(room.status).toBe(201);
    expect(room.json.venueId).toBe(venueId);

    const fetched = await call({ path: `/venues/${venueId}`, org });
    expect(fetched.json.name).toBe("Volvo");
    const patched = await call({
      method: "PATCH",
      path: `/venues/${venueId}`,
      org,
      body: { city: "Göteborg" },
    });
    expect(patched.status).toBe(200);
    expect(patched.json).toMatchObject({ name: "Volvo", city: "Göteborg" });

    const nested = await call({ path: `/venues/${venueId}/rooms`, org });
    expect(nested.json.items).toHaveLength(1);
    const flat = await call({ path: `/rooms?venueId=${venueId}`, org });
    expect(flat.json.items[0].id).toBe(room.json.id);
    const roomPatch = await call({
      method: "PATCH",
      path: `/rooms/${room.json.id}`,
      org,
      body: { hasDaylight: true },
    });
    expect(roomPatch.json.hasDaylight).toBe(true);

    const archived = await call({ method: "DELETE", path: `/venues/${venueId}`, org });
    expect(archived.status).toBe(200);
    expect(archived.json.status).toBe("ARCHIVED");
    const rooms = await call({ path: `/rooms/${room.json.id}`, org });
    expect(rooms.json.status).toBe("ARCHIVED");
  });

  it("paginates with limit and cursor", async () => {
    const org = newOrgId();
    for (const name of ["A", "B", "C"]) {
      await call({ method: "POST", path: "/venues", org, body: { name } });
    }
    const first = await call({ path: "/venues?limit=2", org });
    expect(first.json.items.map((v: { name: string }) => v.name)).toEqual(["A", "B"]);
    expect(first.json.nextCursor).toBeTruthy();
    const second = await call({ path: `/venues?limit=2&cursor=${first.json.nextCursor}`, org });
    expect(second.json.items.map((v: { name: string }) => v.name)).toEqual(["C"]);
    expect(second.json.nextCursor).toBeNull();
  });

  it("serves search at GET /search", async () => {
    const org = newOrgId();
    await call({ method: "POST", path: "/venues", org, body: { name: "Herrgården Solbacka" } });
    const result = await call({ path: "/search?query=Solbacka&entityTypes=venue&limit=5", org });
    expect(result.status).toBe(200);
    expect(Array.isArray(result.json.hits)).toBe(true);
  });
});
