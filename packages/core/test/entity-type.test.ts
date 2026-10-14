import { describe, expect, it } from "vitest";
import {
  archiveEntityType,
  createEntityType,
  createSetup,
  execute,
  listEntityTypes,
  updateEntityType,
  updateItem,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { createRoomType, createTestItem } from "./item-helpers";

describe("entity types and behaviours (ADR 0021)", () => {
  it("validates behaviour dependencies and that only item types have behaviours", async () => {
    const context = testContext();
    const setupsAlone = await execute({
      operation: createEntityType,
      input: { base: "ITEM", name: "X", behaviours: ["SETUPS"] },
      context,
    });
    expect(errorCode({ result: setupsAlone })).toBe("VALIDATION");
    const choices = await execute({
      operation: createEntityType,
      input: { base: "ITEM", name: "X", behaviours: ["CHOICES"] },
      context,
    });
    expect(errorCode({ result: choices })).toBe("VALIDATION");
    const customer = await execute({
      operation: createEntityType,
      input: { base: "CUSTOMER", name: "Company", behaviours: ["PRICED"] },
      context,
    });
    expect(errorCode({ result: customer })).toBe("VALIDATION");
  });

  it("keeps names unique per base and filters by base", async () => {
    const context = testContext();
    await createRoomType({ context });
    const dup = await execute({
      operation: createEntityType,
      input: { base: "ITEM", name: "Konferensrum" },
      context,
    });
    expect(errorCode({ result: dup })).toBe("CONFLICT");
    unwrap({
      result: await execute({
        operation: createEntityType,
        input: { base: "BOOKING", name: "Konferensrum" },
        context,
      }),
    });
    const items = unwrap({
      result: await execute({ operation: listEntityTypes, input: { base: "ITEM" }, context }),
    });
    expect(items.items.map((type) => type.base)).toEqual(["ITEM"]);
  });

  it("refuses to switch a behaviour off while items have data for it", async () => {
    const context = testContext();
    const type = await createRoomType({ context });
    const setup = unwrap({
      result: await execute({ operation: createSetup, input: { name: "Theatre" }, context }),
    });
    const item = await createTestItem({ context, entityTypeId: type.id, name: "Vinga" });
    type Behaviours = ("BOOKABLE" | "SETUPS" | "PRICED")[];
    const off = ({ behaviours }: { behaviours: Behaviours }) =>
      execute({ operation: updateEntityType, input: { id: type.id, behaviours }, context });
    expect(errorCode({ result: await off({ behaviours: ["BOOKABLE", "SETUPS"] }) })).toBeNull();
    const priced = await off({ behaviours: ["BOOKABLE", "SETUPS", "PRICED"] });
    expect(errorCode({ result: priced })).toBeNull();
    unwrap({
      result: await execute({
        operation: updateItem,
        input: { id: item.id, priceMinor: 450_000, setups: [{ setupId: setup.id, capacity: 220 }] },
        context,
      }),
    });
    expect(errorCode({ result: await off({ behaviours: ["BOOKABLE", "SETUPS"] }) })).toBe(
      "CONFLICT",
    );
    expect(errorCode({ result: await off({ behaviours: ["BOOKABLE", "PRICED"] }) })).toBe(
      "CONFLICT",
    );
    expect(errorCode({ result: await off({ behaviours: ["SETUPS", "PRICED"] }) })).toBe(
      "VALIDATION",
    );
  });

  it("refuses to archive a type with active items", async () => {
    const context = testContext();
    const type = await createRoomType({ context });
    await createTestItem({ context, entityTypeId: type.id, name: "Vinga" });
    const archived = await execute({
      operation: archiveEntityType,
      input: { id: type.id },
      context,
    });
    expect(errorCode({ result: archived })).toBe("CONFLICT");
  });
});
