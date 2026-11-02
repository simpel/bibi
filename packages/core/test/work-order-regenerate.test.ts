import { describe, expect, it } from "vitest";
import { archiveWorkOrderDefinition, execute, listWorkOrders } from "../src/index";
import { unwrap } from "./helpers";
import { type SetupResult, setCount, workOrderSetup } from "./work-order-helpers";

const versions = async ({ context, ticket }: SetupResult) =>
  unwrap({
    result: await execute({
      operation: listWorkOrders,
      input: { ticketId: ticket.id },
      context,
    }),
  }).items.map((workOrder) => workOrder.version);

describe("work orders regenerate after a ticket change (ADR 0092)", () => {
  it("adds a version when the change shows on the work order, none when nothing differs", async () => {
    const setup = await workOrderSetup();
    const { context, count } = setup;
    unwrap({ result: await setCount({ context, id: count.id, quantity: 7 }) });
    expect(await versions(setup)).toEqual([1]);
    unwrap({ result: await setCount({ context, id: count.id, quantity: 9 }) });
    expect(await versions(setup)).toEqual([2, 1]);
    unwrap({ result: await setCount({ context, id: count.id, quantity: 9 }) });
    expect(await versions(setup)).toEqual([2, 1]);
  });

  it("leaves an archived definition alone", async () => {
    const setup = await workOrderSetup();
    const { context, count, definition } = setup;
    const input = { id: definition.id };
    unwrap({ result: await execute({ operation: archiveWorkOrderDefinition, input, context }) });
    unwrap({ result: await setCount({ context, id: count.id, quantity: 7 }) });
    expect(await versions(setup)).toEqual([]);
  });
});
