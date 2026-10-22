import { describe, expect, it } from "vitest";
import {
  archiveItem,
  archiveItemDemand,
  archiveVocabularyValue,
  createItemDemand,
  execute,
  updateEntityType,
} from "../src/index";
import { avSetup } from "./allocation-helpers";
import { errorCode, unwrap } from "./helpers";
import { createPool } from "./item-pool-helpers";
import { createTestLine } from "./line-helpers";

type Setup = Awaited<ReturnType<typeof avSetup>>;

const bookAv = ({ setup, unit }: { setup: Setup; unit: number }) =>
  createTestLine({
    context: setup.context,
    ticketId: setup.ticket.id,
    entityTypeId: setup.type.id,
    itemId: setup.av.ids[unit],
    from: 10,
    to: 12,
  });

describe("demands: feature scope and lifecycle (ADR 0050, 0059)", () => {
  it("names window times in a refusal only to callers who may read lines", async () => {
    const setup = await avSetup();
    const { context } = setup;
    unwrap({ result: await bookAv({ setup, unit: 0 }) });
    unwrap({ result: await bookAv({ setup, unit: 1 }) });
    const old = { id: setup.demands[2]?.id ?? "" };
    unwrap({ result: await execute({ operation: archiveItemDemand, input: old, context }) });
    unwrap({ result: await bookAv({ setup, unit: 2 }) });
    const input = {
      itemId: setup.av.ids[2] ?? "",
      entityTypeId: setup.technicians.type.id,
      windows: ["SETUP", "TEARDOWN"] as const,
    };
    const itemOnly = { ...context, permissions: { ...context.permissions, program: [] } };
    const hidden = await execute({ operation: createItemDemand, input, context: itemOnly });
    expect(errorCode({ result: hidden })).toBe("CONFLICT");
    expect(hidden.ok ? "" : hidden.error.message).toBe(
      "No free unit in the pool Technician for SETUP, TEARDOWN",
    );
    const shown = await execute({ operation: createItemDemand, input, context });
    expect(shown.ok ? "" : shown.error.message).toContain("SETUP 2026-11-01T09:45:00.000Z");
  });

  it("refuses to archive an allocated unit, a demand's target or a pool's last bookability", async () => {
    const setup = await avSetup();
    const { context } = setup;
    unwrap({ result: await bookAv({ setup, unit: 0 }) });
    const tech = { id: setup.technicians.ids[0] ?? "" };
    const allocated = await execute({ operation: archiveItem, input: tech, context });
    expect(errorCode({ result: allocated })).toBe("CONFLICT");
    const target = {
      itemId: setup.room.id,
      targetItemId: setup.av.ids[2] ?? "",
      windows: ["BOOKING"] as const,
    };
    unwrap({ result: await execute({ operation: createItemDemand, input: target, context }) });
    const targeted = { id: setup.av.ids[2] ?? "" };
    const refused = await execute({ operation: archiveItem, input: targeted, context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const unbookable = { id: setup.technicians.type.id, capabilities: [] };
    const off = await execute({ operation: updateEntityType, input: unbookable, context });
    expect(errorCode({ result: off })).toBe("CONFLICT");
  });

  it("refuses to archive a list value a demand's pool requires", async () => {
    const setup = await avSetup();
    const { context } = setup;
    const pool = await createPool({ context });
    const input = {
      itemId: setup.room.id,
      entityTypeId: pool.type.id,
      tagValueIds: [pool.wireless],
      windows: ["BOOKING"] as const,
    };
    unwrap({ result: await execute({ operation: createItemDemand, input, context }) });
    const value = { id: pool.wireless };
    const refused = await execute({ operation: archiveVocabularyValue, input: value, context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
  });
});
