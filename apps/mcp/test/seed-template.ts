import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { expect } from "vitest";
import { call } from "./helpers";
import { seedProgram } from "./seed-program";

export type SeedTemplateInput = { client: Client };

/** A predefined ticket built from the organization's own seeded ticket, item and types. */
export async function seedTemplate({ client }: SeedTemplateInput) {
  const seed = await seedProgram({ client });
  const ticket = (await call({ client, name: "ticket_get", args: { id: seed.ticketId } })).data;
  const args = {
    name: "Secret template",
    entityTypeId: ticket.entityTypeId,
    statusId: ticket.statusId,
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
  const made = await call({ client, name: "ticketTemplate_create", args });
  expect(made.isError, JSON.stringify(made.data)).toBe(false);
  return { ...seed, ...ticket, args, id: made.data.id as string, customerId: ticket.customerId };
}
