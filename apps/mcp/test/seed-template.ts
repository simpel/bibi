import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { expect } from "vitest";
import { call } from "./helpers";
import { seedProgram } from "./seed-program";

export type SeedTemplateInput = { client: Client };

/** A predefined order built from the organization's own seeded order, item and types. */
export async function seedTemplate({ client }: SeedTemplateInput) {
  const seed = await seedProgram({ client });
  const order = (await call({ client, name: "order_get", args: { id: seed.orderId } })).data;
  const args = {
    name: "Secret template",
    entityTypeId: order.entityTypeId,
    statusId: order.statusId,
    lines: [
      {
        entityTypeId: seed.programTypeId,
        name: "Secret line",
        itemId: seed.itemId,
        offsetMinutes: 0,
        durationMinutes: 60,
      },
    ],
  };
  const made = await call({ client, name: "orderTemplate_create", args });
  expect(made.isError, JSON.stringify(made.data)).toBe(false);
  return { ...seed, ...order, args, id: made.data.id as string, customerId: order.customerId };
}
