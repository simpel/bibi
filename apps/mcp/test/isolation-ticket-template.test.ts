import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedProgram } from "./seed-program";

/** A predefined ticket built from the organization's own seeded ticket, item and types. */
async function seedTemplate({ client }: { client: Client }) {
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

const START = "2026-12-01T08:00:00.000Z";

describe("cross-organization isolation: predefined tickets", () => {
  it("hides one organization's template and refuses its ids on another's", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const secret = await seedTemplate({ client: a });
    const own = await seedTemplate({ client: b });
    for (const [name, args] of [
      ["ticketTemplate_get", { id: secret.id }],
      ["ticketTemplate_update", { id: secret.id, name: "Hijacked" }],
      ["ticketTemplate_archive", { id: secret.id }],
      [
        "ticket_createFromTemplate",
        { templateId: secret.id, customerId: own.customerId, startsAt: START, headcount: 4 },
      ],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    const intruder = { ...secret.args, name: "Intruder" };
    const [typeIssue, statusIssue, itemIssue] = await Promise.all([
      call({
        client: b,
        name: "ticketTemplate_create",
        args: { ...own.args, name: "Other type", entityTypeId: secret.entityTypeId },
      }),
      call({
        client: b,
        name: "ticketTemplate_create",
        args: { ...own.args, name: "Other status", statusId: secret.statusId },
      }),
      call({ client: b, name: "ticketTemplate_create", args: intruder }),
    ]);
    for (const refused of [typeIssue, statusIssue, itemIssue]) {
      expect(refused.data.code, JSON.stringify(refused.data)).toBe("VALIDATION");
    }
    const foreignCustomer = await call({
      client: b,
      name: "ticket_createFromTemplate",
      args: { templateId: own.id, customerId: secret.customerId, startsAt: START, headcount: 4 },
    });
    expect(foreignCustomer.data.code).toBe("VALIDATION");
    const listed = await call({ client: b, name: "ticketTemplate_list" });
    expect(listed.data.items.map((item: { id: string }) => item.id)).toEqual([own.id]);
    const still = await call({ client: a, name: "ticketTemplate_get", args: { id: secret.id } });
    expect(still.data.name).toBe("Secret template");
  });
});
