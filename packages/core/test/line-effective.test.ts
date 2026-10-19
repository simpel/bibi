import { describe, expect, it } from "vitest";
import {
  createPriceList,
  execute,
  getLine,
  setPriceListItems,
  updateItem,
  updateLine,
  updateTicket,
} from "../src/index";
import { unwrap } from "./helpers";
import { createTestLine, programSetup } from "./line-helpers";

type Later = { name: string; from: Date; to: Date | null; priceMinor: number };
type Setup = Awaited<ReturnType<typeof programSetup>>;

async function pricedSetup() {
  const setup = await programSetup();
  const { context, room } = setup;
  const input = {
    id: room.id,
    priceMinor: 100_000,
    priceUnit: "PER_UNIT" as const,
    vatRatePercent: 25,
  };
  unwrap({ result: await execute({ operation: updateItem, input, context }) });
  const line = unwrap({
    result: await createTestLine({
      ...{ context, ticketId: setup.ticket.id, entityTypeId: setup.type.id },
      ...{ itemId: room.id, from: 10, to: 12 },
    }),
  });
  return { ...setup, line };
}

const read = async ({ setup, id }: { setup: Setup; id: string }) =>
  unwrap({ result: await execute({ operation: getLine, input: { id }, context: setup.context }) });

describe("line commercial values (ADR 0052)", () => {
  it("inherits the item's price and VAT, and an override wins until cleared", async () => {
    const setup = await pricedSetup();
    const { context, line } = setup;
    expect(line).toMatchObject({
      ...{ unitPriceMinor: null, effectiveUnitPriceMinor: 100_000, unitPriceSource: "ITEM" },
      ...{ effectiveVatRatePercent: 25, vatRateSource: "ITEM" },
      ...{ effectiveDiscountPercent: 0, discountSource: null },
    });
    const input = { id: line.id, unitPriceMinor: 80_000, discountPercent: 5, vatRatePercent: 12 };
    const changed = unwrap({ result: await execute({ operation: updateLine, input, context }) });
    expect(changed).toMatchObject({
      ...{ effectiveUnitPriceMinor: 80_000, unitPriceSource: "LINE" },
      ...{ effectiveDiscountPercent: 5, discountSource: "LINE" },
      ...{ effectiveVatRatePercent: 12, vatRateSource: "LINE" },
    });
    const clear = {
      id: line.id,
      unitPriceMinor: null,
      discountPercent: null,
      vatRatePercent: null,
    };
    unwrap({ result: await execute({ operation: updateLine, input: clear, context }) });
    expect(await read({ setup, id: line.id })).toMatchObject({ unitPriceSource: "ITEM" });
  });

  it("shows a price list change at once, with no change to the line", async () => {
    const setup = await pricedSetup();
    const { context, line, room, ticket } = setup;
    const list = unwrap({
      result: await execute({
        operation: createPriceList,
        input: { name: "Agreement", customerId: ticket.customerId },
        context,
      }),
    });
    const items = [{ itemId: room.id, priceMinor: 90_000 }];
    unwrap({
      result: await execute({
        operation: setPriceListItems,
        input: { id: list.id, items },
        context,
      }),
    });
    expect(await read({ setup, id: line.id })).toMatchObject({
      ...{ effectiveUnitPriceMinor: 90_000, unitPriceSource: "PRICE_LIST" },
    });
    // An expired list is ignored; of the valid ones, the newest start wins.
    const later = async ({ name, from, to, priceMinor }: Later) => {
      const input = { name, customerId: ticket.customerId, validFrom: from, validTo: to };
      const made = unwrap({
        result: await execute({ operation: createPriceList, input, context }),
      });
      const set = { id: made.id, items: [{ itemId: room.id, priceMinor }] };
      unwrap({ result: await execute({ operation: setPriceListItems, input: set, context }) });
    };
    await later({
      name: "Old",
      from: new Date("2026-10-20"),
      to: new Date("2026-10-31"),
      priceMinor: 1,
    });
    await later({ name: "Autumn", from: new Date("2026-10-15"), to: null, priceMinor: 85_000 });
    expect(await read({ setup, id: line.id })).toMatchObject({ effectiveUnitPriceMinor: 85_000 });
  });

  it("applies the customer's general discount to the item's price", async () => {
    const setup = await pricedSetup();
    const { context, line, ticket } = setup;
    const input = { name: "Framework", customerId: ticket.customerId, discountPercent: 15 };
    unwrap({ result: await execute({ operation: createPriceList, input, context }) });
    expect(await read({ setup, id: line.id })).toMatchObject({
      ...{ effectiveUnitPriceMinor: 100_000, unitPriceSource: "ITEM" },
      ...{ effectiveDiscountPercent: 15, discountSource: "PRICE_LIST" },
    });
  });

  it("counts the ticket's headcount when the line has no quantity", async () => {
    const setup = await pricedSetup();
    const { context, line, ticket } = setup;
    expect(line).toMatchObject({ effectiveQuantity: null, quantitySource: null });
    const estimate = { id: ticket.id, estimatedHeadcount: 40 };
    unwrap({ result: await execute({ operation: updateTicket, input: estimate, context }) });
    expect(await read({ setup, id: line.id })).toMatchObject({
      ...{ effectiveQuantity: 40, quantitySource: "ESTIMATED_HEADCOUNT" },
    });
    const guaranteed = { id: ticket.id, guaranteedHeadcount: 36 };
    unwrap({ result: await execute({ operation: updateTicket, input: guaranteed, context }) });
    expect(await read({ setup, id: line.id })).toMatchObject({
      ...{ effectiveQuantity: 36, quantitySource: "GUARANTEED_HEADCOUNT" },
    });
    const own = { id: line.id, quantity: 2 };
    unwrap({ result: await execute({ operation: updateLine, input: own, context }) });
    expect(await read({ setup, id: line.id })).toMatchObject({
      ...{ effectiveQuantity: 2, quantitySource: "LINE" },
    });
  });
});
