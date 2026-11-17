import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

describe("removing a column over MCP (ADR 0111)", () => {
  it("lets a member remove one from their own view, not from the default view", async () => {
    const admin = testContext();
    const setup = await connect({ context: admin });
    const status = await call({
      client: setup,
      name: "orderStatus_create",
      args: { name: "Open", color: "#22c55e" },
    });
    expect(status.isError, JSON.stringify(status.data)).toBe(false);
    const member = await connect({
      context: testContext({ organizationId: admin.organizationId, access: "read" }),
    });
    const view = await call({ client: member, name: "board_create", args: { name: "Mine" } });
    expect(view.isError, JSON.stringify(view.data)).toBe(false);
    expect(view.data.viewerCan).toEqual({ edit: true, manage: true });
    const phase = await call({
      client: member,
      name: "boardPhase_create",
      args: { boardId: view.data.id, name: "Col" },
    });
    const own = await call({
      client: member,
      name: "boardPhase_archive",
      args: { id: phase.data.id },
    });
    expect(own.isError, JSON.stringify(own.data)).toBe(false);

    const listed = await call({ client: member, name: "board_list", args: {} });
    const base = listed.data.items.find((item: { isDefault: boolean }) => item.isDefault);
    const refused = await call({
      client: member,
      name: "boardPhase_archive",
      args: { id: base.phases[0].id },
    });
    expect(refused.isError).toBe(true);
    expect(refused.data.code).toBe("FORBIDDEN");
  });
});
