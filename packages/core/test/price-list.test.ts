import { describe, expect, it } from "vitest";
import {
  archiveCustomer,
  archivePriceList,
  createPriceList,
  execute,
  getPriceList,
  listPriceLists,
  setPriceListItems,
  updatePriceList,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { priceListSetup } from "./price-list-helpers";

const agreement = "Nordkust framework agreement −15 %";

describe("price lists (ADR 0023)", () => {
  it("creates a customer discount list, reads and lists it", async () => {
    const context = testContext();
    const { customer } = await priceListSetup({ context });
    const input = {
      name: agreement,
      customerId: customer.id,
      validFrom: new Date("2026-01-01"),
      validTo: new Date("2026-12-31"),
      discountPercent: 15,
    };
    const created = unwrap({
      result: await execute({ operation: createPriceList, input, context }),
    });
    expect(created).toMatchObject({ discountPercent: 15, items: [], customerId: customer.id });
    const read = unwrap({
      result: await execute({ operation: getPriceList, input: { id: created.id }, context }),
    });
    expect(read.name).toBe(agreement);
    const page = unwrap({
      result: await execute({
        operation: listPriceLists,
        input: { customerId: customer.id },
        context,
      }),
    });
    expect(page.items.map(({ id }) => id)).toEqual([created.id]);
  });

  it("refuses reversed validity and unknown customers", async () => {
    const context = testContext();
    const reversed = await execute({
      operation: createPriceList,
      input: { name: "Late", validFrom: new Date("2026-06-01"), validTo: new Date("2026-05-01") },
      context,
    });
    expect(errorCode({ result: reversed })).toBe("VALIDATION");
    const unknown = await execute({
      operation: createPriceList,
      input: { name: "Nobody", customerId: "missing" },
      context,
    });
    expect(errorCode({ result: unknown })).toBe("VALIDATION");
  });

  it("keeps discount and item prices apart and replaces items as a set", async () => {
    const context = testContext();
    const { room, unpriced } = await priceListSetup({ context });
    const list = unwrap({
      result: await execute({ operation: createPriceList, input: { name: "Rooms" }, context }),
    });
    const set = ({ items }: { items: { itemId: string; priceMinor: number }[] }) =>
      execute({ operation: setPriceListItems, input: { id: list.id, items }, context });
    const priced = unwrap({
      result: await set({ items: [{ itemId: room.id, priceMinor: 450_000 }] }),
    });
    expect(priced.items).toEqual([{ itemId: room.id, priceMinor: 450_000 }]);
    expect(
      errorCode({ result: await set({ items: [{ itemId: unpriced.id, priceMinor: 1 }] }) }),
    ).toBe("VALIDATION");
    const both = await execute({
      operation: updatePriceList,
      input: { id: list.id, discountPercent: 10 },
      context,
    });
    expect(errorCode({ result: both })).toBe("VALIDATION");
    expect(unwrap({ result: await set({ items: [] }) }).items).toEqual([]);
    const discounted = unwrap({
      result: await execute({
        operation: updatePriceList,
        input: { id: list.id, discountPercent: 12.5 },
        context,
      }),
    });
    expect(discounted.discountPercent).toBe(12.5);
    const refused = await set({ items: [{ itemId: room.id, priceMinor: 1 }] });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
  });

  it("blocks archiving a customer while it has an active price list", async () => {
    const context = testContext();
    const { customer } = await priceListSetup({ context });
    const list = unwrap({
      result: await execute({
        operation: createPriceList,
        input: { name: agreement, customerId: customer.id, discountPercent: 15 },
        context,
      }),
    });
    const archive = () =>
      execute({ operation: archiveCustomer, input: { id: customer.id }, context });
    expect(errorCode({ result: await archive() })).toBe("CONFLICT");
    unwrap({
      result: await execute({ operation: archivePriceList, input: { id: list.id }, context }),
    });
    expect(errorCode({ result: await archive() })).toBeNull();
  });

  it("is invisible to other organizations and needs priceList permissions", async () => {
    const context = testContext();
    const list = unwrap({
      result: await execute({ operation: createPriceList, input: { name: "Own" }, context }),
    });
    const other = testContext();
    const read = await execute({ operation: getPriceList, input: { id: list.id }, context: other });
    expect(errorCode({ result: read })).toBe("NOT_FOUND");
    const reader = testContext({ organizationId: context.organizationId, access: "read" });
    const write = await execute({
      operation: createPriceList,
      input: { name: "Nope" },
      context: reader,
    });
    expect(errorCode({ result: write })).toBe("FORBIDDEN");
  });
});
