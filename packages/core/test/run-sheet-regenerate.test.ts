import { describe, expect, it } from "vitest";
import { archiveRunSheetDefinition, execute, listRunSheets } from "../src/index";
import { unwrap } from "./helpers";
import { runSheetSetup, type SetupResult, setCount } from "./run-sheet-helpers";

const versions = async ({ context, order }: SetupResult) =>
  unwrap({
    result: await execute({
      operation: listRunSheets,
      input: { orderId: order.id },
      context,
    }),
  }).items.map((runSheet) => runSheet.version);

describe("run sheets regenerate after an order change (ADR 0092)", () => {
  it("adds a version when the change shows on the run sheet, none when nothing differs", async () => {
    const setup = await runSheetSetup();
    const { context, count } = setup;
    unwrap({ result: await setCount({ context, id: count.id, quantity: 7 }) });
    expect(await versions(setup)).toEqual([1]);
    unwrap({ result: await setCount({ context, id: count.id, quantity: 9 }) });
    expect(await versions(setup)).toEqual([2, 1]);
    unwrap({ result: await setCount({ context, id: count.id, quantity: 9 }) });
    expect(await versions(setup)).toEqual([2, 1]);
  });

  it("leaves an archived definition alone", async () => {
    const setup = await runSheetSetup();
    const { context, count, definition } = setup;
    const input = { id: definition.id };
    unwrap({ result: await execute({ operation: archiveRunSheetDefinition, input, context }) });
    unwrap({ result: await setCount({ context, id: count.id, quantity: 7 }) });
    expect(await versions(setup)).toEqual([]);
  });
});
