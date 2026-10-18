import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { expect } from "vitest";
import { call } from "./helpers";
import { seedBooking } from "./seed-booking";

export type SeedProgramInput = { client: Client };

export type SeededProgram = {
  bookingId: string;
  itemId: string;
  programItemId: string;
  programTypeId: string;
  requirementTypeId: string;
  valueId: string;
};

const START = "2026-11-03T09:00:00.000Z";
const END = "2026-11-03T11:00:00.000Z";

async function ok({ client, name, args }: { client: Client; name: string; args: object }) {
  const result = await call({ client, name, args: args as Record<string, unknown> });
  expect(result.isError, `${name}: ${JSON.stringify(result.data)}`).toBe(false);
  return result.data;
}

async function type({ client, ...args }: { client: Client; base: string; name: string }) {
  return ok({ client, name: "entityType_create", args });
}

/** A booking with a bookable item, a program item, and a list value to count requirements of. */
export async function seedProgram({ client }: SeedProgramInput): Promise<SeededProgram> {
  const { id: bookingId } = await seedBooking({ client });
  const roomType = await ok({
    client,
    name: "entityType_create",
    args: { base: "ITEM", name: "Secret room", behaviours: ["BOOKABLE"] },
  });
  const item = await ok({
    client,
    name: "item_create",
    args: { entityTypeId: roomType.id, name: "Secret hall" },
  });
  const programType = await type({ client, base: "PROGRAM_ITEM", name: "Secret session" });
  const requirementType = await type({ client, base: "REQUIREMENT", name: "Secret need" });
  const programItem = await ok({
    client,
    name: "programItem_create",
    args: {
      bookingId,
      entityTypeId: programType.id,
      name: "Hidden session",
      startsAt: START,
      endsAt: END,
      itemId: item.id,
    },
  });
  const list = await ok({
    client,
    name: "vocabulary_create",
    args: { name: "Secret allergens", values: ["Gluten"] },
  });
  return {
    bookingId,
    itemId: item.id,
    programItemId: programItem.id,
    programTypeId: programType.id,
    requirementTypeId: requirementType.id,
    valueId: list.values[0].id,
  };
}
