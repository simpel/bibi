import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

const STATUS = { name: "Open", color: "#22c55e" } as const;

describe("cross-organization isolation: boards and phases", () => {
  it("hides one organization's boards and phases and refuses its ids in another's", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const status = await call({ client: a, name: "ticketStatus_create", args: STATUS });
    const board = await call({ client: a, name: "board_create", args: { name: "Secret board" } });
    expect(board.isError, JSON.stringify(board.data)).toBe(false);
    const phase = await call({
      client: a,
      name: "boardPhase_create",
      args: { boardId: board.data.id, name: "Secret phase" },
    });
    expect(phase.isError, JSON.stringify(phase.data)).toBe(false);
    const own = await call({ client: b, name: "board_create", args: { name: "Own board" } });
    expect(own.isError, JSON.stringify(own.data)).toBe(false);
    const ownPhase = await call({
      client: b,
      name: "boardPhase_create",
      args: { boardId: own.data.id, name: "Own phase" },
    });

    const listed = await call({ client: b, name: "board_list", args: {} });
    expect(listed.data.items.map((item: { id: string }) => item.id)).toEqual([own.data.id]);
    const refused = [
      ["board_get", { id: board.data.id }],
      ["board_update", { id: board.data.id, name: "Hacked" }],
      ["board_archive", { id: board.data.id }],
      ["boardPhase_create", { boardId: board.data.id, name: "X" }],
      ["boardPhase_update", { id: phase.data.id, name: "Hacked" }],
      ["boardPhase_archive", { id: phase.data.id }],
      ["boardPhase_reorder", { boardId: board.data.id, ids: [phase.data.id] }],
      [
        "boardPhase_moveStatus",
        { boardId: board.data.id, statusId: status.data.id, phaseId: phase.data.id },
      ],
    ] as const;
    for (const [name, args] of refused) {
      const result = await call({ client: b, name, args });
      expect(result.data.code, name).toBe("NOT_FOUND");
    }
    const foreign = [
      ["board_reorder", { ids: [board.data.id, own.data.id] }],
      [
        "boardPhase_moveStatus",
        { boardId: own.data.id, statusId: status.data.id, phaseId: phase.data.id },
      ],
      [
        "boardPhase_moveStatus",
        { boardId: own.data.id, statusId: status.data.id, phaseId: ownPhase.data.id },
      ],
      ["boardPhase_reorder", { boardId: own.data.id, ids: [phase.data.id] }],
      ["board_create", { name: "Mine", entityTypeId: "not-mine" }],
    ] as const;
    for (const [name, args] of foreign) {
      const result = await call({ client: b, name, args });
      expect(result.isError, `${name} ${JSON.stringify(args)}`).toBe(true);
      expect(["NOT_FOUND", "VALIDATION"], name).toContain(result.data.code);
    }
    const mine = await call({ client: a, name: "board_get", args: { id: board.data.id } });
    expect(mine.data.name).toBe("Secret board");
    expect(mine.data.phases.map((row: { name: string }) => row.name)).toContain("Secret phase");
  });
});
