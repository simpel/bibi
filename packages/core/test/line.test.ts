import { describe, expect, it } from "vitest";
import {
  createEntityType,
  createLayout,
  execute,
  getLine,
  listLines,
  updateLine,
} from "../src/index";
import { createTypeWithField } from "./customer-helpers";
import { errorCode, unwrap } from "./helpers";
import { createTestItem } from "./item-helpers";
import { createTestLine, programSetup } from "./line-helpers";
import { testOrg } from "./org-helpers";

type Failure = { ok: boolean; error?: { code: string; issues: readonly { path: string }[] } };

const issueOf = ({ result }: { result: Failure }) =>
  result.ok ? null : { code: result.error?.code, path: result.error?.issues[0]?.path };

describe("line (ADR 0022)", () => {
  it("adds lines to an order with own fields and lists them by time", async () => {
    const { context, order, type, key } = await programSetup();
    const base = { context, orderId: order.id, entityTypeId: type.id };
    unwrap({ result: await createTestLine({ ...base, from: 13, to: 14 }) });
    const first = unwrap({
      result: await execute({
        operation: updateLine,
        input: {
          id: unwrap({ result: await createTestLine({ ...base, from: 9, to: 10 }) }).id,
          quantity: 40,
          fields: { [key]: "A-12" },
        },
        context,
      }),
    });
    expect(first).toMatchObject({ quantity: 40, fields: { [key]: "A-12" } });
    const input = { orderId: order.id };
    const list = unwrap({ result: await execute({ operation: listLines, input, context }) });
    expect(list.items.map((item) => item.id)[0]).toBe(first.id);
    expect(list.items).toHaveLength(2);
  });

  it("refuses an unknown type, order, item or layout", async () => {
    const { context, order, type, room, layout } = await programSetup();
    const base = { context, orderId: order.id, entityTypeId: type.id, from: 9, to: 10 };
    const orderType = await createTypeWithField({ context, base: "ORDER", name: "Other" });
    const plainType = unwrap({
      result: await execute({
        operation: createEntityType,
        input: { base: "ITEM", name: "Equipment" },
        context,
      }),
    });
    const plain = await createTestItem({ context, entityTypeId: plainType.id, name: "Projector" });
    const otherRoom = await createTestItem({
      ...{ context, entityTypeId: room.entityTypeId, name: "Hönö" },
    });
    const other = unwrap({
      result: await execute({
        operation: createLayout,
        input: { itemId: otherRoom.id, name: "Cabaret" },
        context,
      }),
    });
    const cases = [
      [{ entityTypeId: orderType.type.id }, "entityTypeId"],
      [{ orderId: "missing" }, "orderId"],
      [{ itemId: "missing" }, "itemId"],
      // Any item can be a line's item, but only a bookable one has layouts.
      [{ itemId: plain.id, layoutId: layout.id }, "itemId"],
      [{ layoutId: layout.id }, "layoutId"],
      // Another room's layout is not this room's (ADR 0103).
      [{ itemId: room.id, layoutId: other.id }, "layoutId"],
    ] as const;
    for (const [input, path] of cases) {
      const result = await createTestLine({ ...base, ...input });
      expect(issueOf({ result })).toEqual({ code: "VALIDATION", path });
    }
    expect(errorCode({ result: await createTestLine({ ...base, from: 10, to: 9 }) })).toBe(
      "VALIDATION",
    );
  });

  it("hides lines from another organization", async () => {
    const { context, order, type } = await programSetup();
    const base = { context, orderId: order.id, entityTypeId: type.id, from: 9, to: 10 };
    const item = unwrap({ result: await createTestLine(base) });
    const foreign = await testOrg();
    const input = { id: item.id };
    const result = await execute({ operation: getLine, input, context: foreign });
    expect(errorCode({ result })).toBe("NOT_FOUND");
    const own = await programSetup();
    const crossOrder = await createTestLine({
      ...base,
      context: own.context,
      entityTypeId: own.type.id,
    });
    expect(issueOf({ result: crossOrder })).toEqual({ code: "VALIDATION", path: "orderId" });
  });
});
