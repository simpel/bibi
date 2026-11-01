import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createId } from "@paralleldrive/cuid2";
import { call } from "./helpers";

export type SeedContactInput = { client: Client; customerId: string };

/** A contact (with its own contact type) at the customer; returns the contact id. */
export async function seedContact({ client, customerId }: SeedContactInput): Promise<string> {
  const type = await call({
    client,
    name: "entityType_create",
    args: { base: "CONTACT", name: `Contact ${createId()}` },
  });
  const contact = await call({
    client,
    name: "contact_create",
    args: { entityTypeId: type.data.id, customerId, name: "Anna Berg" },
  });
  return contact.data.id as string;
}
