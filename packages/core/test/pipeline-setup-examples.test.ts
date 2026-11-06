import { describe, expect, it } from "vitest";
import { createEntityType, createExamplesPipelineSetup, execute } from "../src/index";
import { unwrap } from "./helpers";
import { exampleInput, setUpOrg } from "./pipeline-setup-examples-helpers";

const run = async ({
  context,
  input,
}: {
  context: Awaited<ReturnType<typeof setUpOrg>>;
  input: ReturnType<typeof exampleInput>;
}) => unwrap({ result: await execute({ operation: createExamplesPipelineSetup, input, context }) });

describe("pipelineSetup.createExamples", () => {
  it("creates the missing base types, the customer and three orders with lines", async () => {
    const context = await setUpOrg({ preset: "meeting-space" });
    const input = exampleInput({ space: "Meeting room", food: "Coffee break" });
    const result = await run({ context, input });
    const bases = await context.db.entityType.findMany({
      where: { base: { in: ["CUSTOMER", "CONTACT", "ORDER", "LINE"] } },
      select: { base: true, name: true },
    });
    expect(bases.map(({ base, name }) => `${base}:${name}`).sort()).toEqual([
      "CONTACT:Contact",
      "CUSTOMER:Company",
      "LINE:Line",
      "ORDER:Booking",
    ]);
    expect(result.orderIds).toHaveLength(3);
    const orders = await context.db.order.findMany({
      where: { id: { in: result.orderIds } },
      include: { lines: { include: { item: { include: { entityType: true } } } } },
    });
    for (const order of orders) {
      expect(order.customerId).toBe(result.customerId);
      expect(order.lines.map((line) => line.item?.entityType.name).sort()).toEqual([
        "Coffee break",
        "Meeting room",
      ]);
    }
    // One item per name: the three orders share the room.
    expect(await context.db.item.count({ where: { name: "Meeting room 1" } })).toBe(1);
  });

  it("reuses existing base types instead of creating new ones", async () => {
    const context = await setUpOrg({ preset: "meeting-space" });
    const own = unwrap({
      result: await execute({
        operation: createEntityType,
        input: { base: "CUSTOMER", name: "Client" },
        context,
      }),
    });
    const result = await run({ context, input: exampleInput({ space: "Meeting room" }) });
    const customer = await context.db.customer.findFirstOrThrow({
      where: { id: result.customerId },
    });
    expect(customer.entityTypeId).toBe(own.id);
    expect(await context.db.entityType.count({ where: { base: "CUSTOMER" } })).toBe(1);
  });

  it.each([
    ["meeting-space", "Meeting room", "Confirmed"],
    ["conference-estate", "Conference room", "Site visit"],
  ] as const)(
    "advances in %s into the first open status entered by hand",
    async (preset, space, expected) => {
      const context = await setUpOrg({ preset });
      const result = await run({ context, input: exampleInput({ space }) });
      const orders = await context.db.order.findMany({
        where: { id: { in: result.orderIds } },
        include: { orderStatus: true },
        orderBy: { createdAt: "asc" },
      });
      const byTitle = new Map(orders.map((order) => [order.title, order.orderStatus.name]));
      expect(byTitle.get("Dinner")).toBe(expected);
      expect(orders.filter((order) => order.orderStatus.entry)).toHaveLength(2);
    },
  );

  it("leaves out a line whose item type does not exist", async () => {
    const context = await setUpOrg({ preset: "meeting-space" });
    const input = exampleInput({ space: "Meeting room", food: "No such type" });
    const result = await run({ context, input });
    const lines = await context.db.line.findMany({ where: { orderId: { in: result.orderIds } } });
    expect(lines).toHaveLength(3);
    expect(await context.db.item.count({ where: { name: "Fika" } })).toBe(0);
  });
});
