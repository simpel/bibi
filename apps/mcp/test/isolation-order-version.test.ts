import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedProgram } from "./seed-program";

describe("cross-organization isolation: order versions (ADR 0116)", () => {
  it("hides one organization's versions and refuses to name or restore them", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const secret = await seedProgram({ client: a });
    const listed = await call({
      client: a,
      name: "orderVersion_list",
      args: { orderId: secret.orderId },
    });
    expect(listed.isError, JSON.stringify(listed.data)).toBe(false);
    const [latest] = listed.data.items as { id: string }[];
    const id = latest?.id ?? "";
    expect(id).not.toBe("");

    for (const [name, args] of [
      ["orderVersion_list", { orderId: secret.orderId }],
      ["orderVersion_get", { id }],
      ["orderVersion_name", { id, name: "Hacked" }],
      ["orderVersion_restore", { id }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }

    const mine = await call({ client: a, name: "orderVersion_get", args: { id } });
    expect(mine.data).toMatchObject({ id, name: null, isCurrent: true });
  });
});
