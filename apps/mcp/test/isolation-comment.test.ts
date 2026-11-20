import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedProgram } from "./seed-program";

describe("cross-organization isolation: comments", () => {
  it("hides one organization's comments and refuses to comment on its order", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { orderId, lineId } = await seedProgram({ client: a });
    const made = await call({
      client: a,
      name: "comment_create",
      args: { orderId, lineId, body: "Only for A" },
    });
    expect(made.isError, JSON.stringify(made.data)).toBe(false);
    const id = made.data.id;

    for (const [name, input] of [
      ["comment_get", { id }],
      ["comment_update", { id, body: "Hijacked" }],
      ["comment_archive", { id }],
    ] as const) {
      expect((await call({ client: b, name, args: input })).data.code, name).toBe("NOT_FOUND");
    }
    for (const input of [
      { orderId, body: "x" },
      { orderId, lineId, body: "x" },
    ]) {
      const created = await call({ client: b, name: "comment_create", args: input });
      expect(["NOT_FOUND", "VALIDATION"], JSON.stringify(input)).toContain(created.data.code);
    }
    for (const input of [{ orderId }, { orderId, lineId }]) {
      const listed = await call({ client: b, name: "comment_list", args: input });
      expect(listed.data.items).toEqual([]);
    }

    const own = await call({ client: a, name: "comment_get", args: { id } });
    expect(own.data.body).toBe("Only for A");
  });
});
