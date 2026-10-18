import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

describe("cross-organization isolation: venue archive", () => {
  it("refuses to archive another organization's venue", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const venue = await call({ client: a, name: "venue_create", args: { name: "Secret" } });
    const id = venue.data.id;

    const archived = await call({ client: b, name: "venue_archive", args: { id } });
    expect(archived.data.code).toBe("NOT_FOUND");

    const own = await call({ client: a, name: "venue_get", args: { id } });
    expect(own.data.status).toBe("ACTIVE");
    const ownArchive = await call({ client: a, name: "venue_archive", args: { id } });
    expect(ownArchive.isError, JSON.stringify(ownArchive.data)).toBe(false);
  });
});
