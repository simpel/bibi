import { describe, expect, it } from "vitest";
import {
  applyOverrides,
  execute,
  fulfillRunSheet,
  generateRunSheet,
  getRunSheet,
  listRunSheets,
  publishRunSheet,
  sendRunSheet,
  unfulfillRunSheet,
  type RunSheetDto,
} from "../src/index";
import { errorCode, peer, unwrap } from "./helpers";
import { moveToStatus } from "./order-helpers";
import { confirmOrder, setCount, runSheetSetup } from "./run-sheet-helpers";

type SetupResult = Awaited<ReturnType<typeof runSheetSetup>>;

const generate = ({ context, order, definition }: SetupResult) =>
  execute({
    operation: generateRunSheet,
    input: { orderId: order.id, runSheetDefinitionId: definition.id },
    context,
  });

type SendInput = { setup: SetupResult; runSheet: RunSheetDto };
const send = ({ setup, runSheet }: SendInput) =>
  execute({ operation: sendRunSheet, input: { id: runSheet.id }, context: setup.context });

describe("runSheet.generate (ADR 0021)", () => {
  it("snapshots the order, the included items with fields and the counts", async () => {
    const setup = await runSheetSetup();
    const runSheet = unwrap({ result: await generate(setup) });
    const { responsibilityId } = setup.definition;
    expect(runSheet).toMatchObject({
      version: 1,
      responsibilityId,
      baseVersion: null,
      publishedAt: null,
      fulfilledAt: null,
    });
    expect(runSheet.changes).toEqual([]);
    const [head, item, count] = runSheet.content.rows;
    expect(head).toMatchObject({ kind: "ORDER", key: setup.order.id });
    expect(item).toMatchObject({
      kind: "ITEM",
      key: setup.held.id,
      itemName: "Älvsalen",
      values: { [setup.floor.key]: "Second" },
    });
    expect(count).toMatchObject({
      kind: "REQUIREMENT",
      label: "Gluten",
      quantity: 5,
      parentKey: null,
      values: { list: "Allergens" },
    });
    expect(runSheet.content.rows).toHaveLength(3);
  });

  it("returns the latest version while the order is unchanged", async () => {
    const setup = await runSheetSetup();
    const first = unwrap({ result: await generate(setup) });
    const again = unwrap({ result: await generate(setup) });
    expect(again.id).toBe(first.id);
    const list = unwrap({
      result: await execute({ operation: listRunSheets, input: {}, context: setup.context }),
    });
    expect(list.items).toHaveLength(1);
  });

  it("marks the rows changed since the last SENT version with ★ data", async () => {
    const setup = await runSheetSetup();
    await confirmOrder({ context: setup.context, orderId: setup.order.id });
    const first = unwrap({ result: await generate(setup) });
    unwrap({ result: await send({ setup, runSheet: first }) });
    unwrap({ result: await setCount({ ...setup, id: setup.count.id, quantity: 7 }) });
    const second = unwrap({ result: await generate(setup) });
    expect(second).toMatchObject({ version: 2, baseVersion: 1 });
    expect(second.changes).toEqual([
      {
        key: `order:${setup.gluten}`,
        kind: "REQUIREMENT",
        change: "CHANGED",
        label: "Gluten",
        changed: ["quantity"],
      },
    ]);
    unwrap({ result: await setCount({ ...setup, id: setup.count.id, quantity: 8 }) });
    const third = unwrap({ result: await generate(setup) });
    expect(third).toMatchObject({ version: 3, baseVersion: 1 });
    expect(third.changes.map((change) => change.changed)).toEqual([["quantity"]]);
  });

  it("refuses an unknown order or definition, and other organizations' ids", async () => {
    const setup = await runSheetSetup();
    const other = await runSheetSetup();
    const unknown = { ...setup, order: { ...setup.order, id: "nope" } };
    expect(errorCode({ result: await generate(unknown) })).toBe("NOT_FOUND");
    const foreign = { ...setup, definition: other.definition };
    expect(errorCode({ result: await generate(foreign) })).toBe("NOT_FOUND");
    const reader = peer({ of: setup.context, access: "read" });
    expect(errorCode({ result: await generate({ ...setup, context: reader }) })).toBe("FORBIDDEN");
  });

  it("needs view on the program it copies (ADR 0050)", async () => {
    const setup = await runSheetSetup();
    const overrides = [{ feature: "program", action: "read", effect: "deny" }];
    const permissions = applyOverrides({ preset: "admin", overrides });
    const result = await generate({ ...setup, context: { ...setup.context, permissions } });
    expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(result.ok ? "" : result.error.message).toContain("missing program:read");
  });
});

describe("runSheet.publish (ADR 0022)", () => {
  it("is published once while the order is open and refused once it is closed", async () => {
    const setup = await runSheetSetup();
    const runSheet = unwrap({ result: await generate(setup) });
    const published = unwrap({ result: await send({ setup, runSheet }) });
    expect(published.publishedAt).toBeInstanceOf(Date);
    expect(errorCode({ result: await send({ setup, runSheet }) })).toBe("CONFLICT");
    const closed = await runSheetSetup();
    const draft = unwrap({ result: await generate(closed) });
    const lost = { context: closed.context, orderId: closed.order.id, name: "Lost" };
    unwrap({ result: await moveToStatus({ ...lost, reason: "Price" }) });
    expect(errorCode({ result: await send({ setup: closed, runSheet: draft }) })).toBe("CONFLICT");
  });

  it("publishes only the latest version", async () => {
    const setup = await runSheetSetup();
    await confirmOrder({ context: setup.context, orderId: setup.order.id });
    const first = unwrap({ result: await generate(setup) });
    unwrap({ result: await setCount({ ...setup, id: setup.count.id, quantity: 6 }) });
    const second = unwrap({ result: await generate(setup) });
    expect(errorCode({ result: await send({ setup, runSheet: first }) })).toBe("CONFLICT");
    expect(errorCode({ result: await send({ setup, runSheet: second }) })).toBeNull();
  });

  it("can be marked as fulfilled and reopened", async () => {
    const setup = await runSheetSetup();
    const runSheet = unwrap({ result: await generate(setup) });
    // Cannot fulfill before publish
    expect(
      errorCode({
        result: await execute({
          operation: fulfillRunSheet,
          input: { id: runSheet.id },
          context: setup.context,
        }),
      }),
    ).toBe("CONFLICT");

    unwrap({ result: await send({ setup, runSheet }) });
    const fulfilled = unwrap({
      result: await execute({
        operation: fulfillRunSheet,
        input: { id: runSheet.id },
        context: setup.context,
      }),
    });
    expect(fulfilled.fulfilledAt).toBeInstanceOf(Date);

    // Reopen
    const reopened = unwrap({
      result: await execute({
        operation: unfulfillRunSheet,
        input: { id: runSheet.id },
        context: setup.context,
      }),
    });
    expect(reopened.fulfilledAt).toBeNull();
  });

  it("gets a version by id and keeps it hidden from other organizations", async () => {
    const setup = await runSheetSetup();
    const runSheet = unwrap({ result: await generate(setup) });
    const input = { id: runSheet.id };
    const got = unwrap({
      result: await execute({ operation: getRunSheet, input, context: setup.context }),
    });
    expect(got.id).toBe(runSheet.id);
    const other = await runSheetSetup();
    const hidden = await execute({ operation: getRunSheet, input, context: other.context });
    expect(errorCode({ result: hidden })).toBe("NOT_FOUND");
  });
});
