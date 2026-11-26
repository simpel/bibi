import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

describe("cross-organization isolation: the Archive page (ADR 0118)", () => {
  it("lists only the caller's own organization's archived records", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const made = await call({ client: a, name: "venue_create", args: { name: "Secret hall" } });
    expect(made.isError, JSON.stringify(made.data)).toBe(false);
    const id = made.data.id as string;
    const archived = await call({ client: a, name: "venue_archive", args: { id } });
    expect(archived.isError, JSON.stringify(archived.data)).toBe(false);

    const own = await call({ client: a, name: "archive_list", args: { kind: "venue" } });
    expect(own.data.items.map((item: { id: string }) => item.id)).toContain(id);
    const other = await call({ client: b, name: "archive_list", args: {} });
    expect(other.isError).toBe(false);
    expect(other.data.items.map((item: { id: string }) => item.id)).not.toContain(id);
    expect((await call({ client: b, name: "venue_restore", args: { id } })).data.code).toBe(
      "NOT_FOUND",
    );
  });
});
