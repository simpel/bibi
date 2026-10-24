import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedTicket } from "./seed-ticket";

const times = {
  desiredStartsAt: "2026-11-03T08:00:00.000Z",
  desiredEndsAt: "2026-11-03T16:00:00.000Z",
};

type Client = Awaited<ReturnType<typeof connect>>;

async function typeOf({ client, base }: { client: Client; base: string }) {
  const type = await call({
    client,
    name: "entityType_create",
    args: { base, name: `Own ${base}` },
  });
  return type.data.id as string;
}

async function contactOf({ client, customerId }: { client: Client; customerId: string }) {
  const type = await typeOf({ client, base: "CONTACT" });
  const contact = await call({
    client,
    name: "contact_create",
    args: { entityTypeId: type, customerId, name: "Secret person" },
  });
  return contact.data.id as string;
}

describe("cross-organization isolation: ticket creation", () => {
  it("refuses ticket.create, update and changeStatus with another organization's ids", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const secret = await seedTicket({ client: a });
    const secretContact = await contactOf({ client: a, customerId: secret.customerId });
    const ticketType = await typeOf({ client: b, base: "TICKET" });
    const created = await call({
      client: b,
      name: "ticket_create",
      args: { entityTypeId: ticketType, customerId: secret.customerId, ...times },
    });
    expect(["NOT_FOUND", "VALIDATION"]).toContain(created.data.code);
    const own = await seedTicket({ client: b });
    const update = await call({
      client: b,
      name: "ticket_update",
      args: { id: own.id, contactId: secretContact },
    });
    expect(update.data.code).toBe("VALIDATION");
    const statusesA = await call({ client: a, name: "ticketStatus_list" });
    const statusA = statusesA.data.items[0].id as string;
    const moved = await call({
      client: b,
      name: "ticket_changeStatus",
      args: { ticketId: own.id, statusId: statusA },
    });
    expect(moved.data.code).toBe("VALIDATION");
    expect((await call({ client: b, name: "ticket_list" })).data.items).toHaveLength(1);
    expect((await call({ client: a, name: "ticket_list" })).data.items).toHaveLength(1);
  });

  it("keeps the pipeline board of one organization free of another's cards", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { id } = await seedTicket({ client: a });
    const boardB = await call({ client: b, name: "pipeline_board" });
    expect(boardB.data.cards).toEqual([]);
    const boardA = await call({ client: a, name: "pipeline_board" });
    expect(boardA.data.cards.map((card: { id: string }) => card.id)).toContain(id);
  });
});

describe("cross-organization isolation: ticket statuses and audit log", () => {
  it("hides ticket statuses from another organization", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const created = await call({
      client: a,
      name: "ticketStatus_create",
      args: { name: "Secret status", color: "#22c55e", entry: true },
    });
    const id = created.data.id as string;
    for (const [name, args] of [
      ["ticketStatus_update", { id, name: "Hijacked" }],
      ["ticketStatus_archive", { id }],
      ["ticketStatus_archivePreview", { id }],
      ["ticketStatus_get", { id }],
      ["ticketStatus_setTransitions", { id, toStatusIds: [] }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    const ownB = await call({
      client: b,
      name: "ticketStatus_create",
      args: { name: "Own status", color: "#3b82f6", entry: true },
    });
    for (const ids of [[id], [ownB.data.id, id]]) {
      const reorder = await call({ client: b, name: "ticketStatus_reorder", args: { ids } });
      expect(reorder.data.code, JSON.stringify(ids)).toBe("VALIDATION");
    }
    const keep = await call({
      client: b,
      name: "ticketStatus_reorder",
      args: { ids: [ownB.data.id] },
    });
    expect(keep.isError, JSON.stringify(keep.data)).toBe(false);
    const imported = await call({
      client: b,
      name: "ticketStatus_importTemplate",
      args: { template: "default" },
    });
    expect(imported.isError, JSON.stringify(imported.data)).toBe(false);
    const listedA = await call({ client: a, name: "ticketStatus_list" });
    const names = listedA.data.items.map((item: { name: string }) => item.name);
    expect(names).toEqual(["Secret status"]);
    const listedB = await call({ client: b, name: "ticketStatus_list" });
    expect(listedB.data.items.map((item: { id: string }) => item.id)).not.toContain(id);
    const own = await call({ client: a, name: "ticketStatus_get", args: { id } });
    expect(own.data.name).toBe("Secret status");
  });

  it("hides audit log entries from another organization", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    await seedTicket({ client: a });
    const listed = await call({ client: a, name: "auditLog_list" });
    const id = listed.data.items[0].id as string;
    expect((await call({ client: b, name: "auditLog_get", args: { id } })).data.code).toBe(
      "NOT_FOUND",
    );
    expect((await call({ client: b, name: "auditLog_list" })).data.items).toEqual([]);
    expect((await call({ client: a, name: "auditLog_get", args: { id } })).data.id).toBe(id);
  });
});
