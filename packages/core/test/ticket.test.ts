import { getEnv } from "@bibi/config";
import { describe, expect, it } from "vitest";
import {
  createTicket,
  execute,
  exportTicket,
  getTicket,
  listTickets,
  ticketReplyAddress,
  updateTicket,
} from "../src/index";
import { createTestCustomer } from "./customer-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import { createTestContact, createTestTicket, ticketSetup } from "./ticket-helpers";
import { statusByName } from "./ticket-status-helpers";

describe("tickets (ADR 0043)", () => {
  it("creates a lead with sequential references in the entry status", async () => {
    const { context, type, key, customer } = await ticketSetup();
    const contact = await createTestContact({ context, customerId: customer.id });
    const created = unwrap({
      result: await execute({
        operation: createTicket,
        input: {
          entityTypeId: type.id,
          customerId: customer.id,
          contactId: contact.id,
          estimatedHeadcount: 40,
          budgetMinor: 5_000_000,
          fields: { [key]: "Kickoff" },
        },
        context,
      }),
    });
    const lead = await statusByName({ context, name: "Lead" });
    expect(created).toMatchObject({
      reference: 1,
      statusId: lead.id,
      contactId: contact.id,
      desiredStartsAt: null,
      estimatedHeadcount: 40,
      statusReason: null,
      fields: { [key]: "Kickoff" },
    });
    const second = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    expect(second.reference).toBe(2);
    const fetched = unwrap({
      result: await execute({ operation: getTicket, input: { id: created.id }, context }),
    });
    const domain = getEnv().MAIL_INBOUND_DOMAIN;
    expect(fetched.inboundAddress).toBe(ticketReplyAddress({ ticketId: created.id, domain }));
  });

  it("updates details but refuses an end before the start and a contact elsewhere", async () => {
    const { context, key, type, customer } = await ticketSetup();
    const ticket = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const update = ({ input }: { input: Record<string, unknown> }) =>
      execute({ operation: updateTicket, input: { id: ticket.id, ...input }, context });
    const updated = unwrap({
      result: await update({ input: { guaranteedHeadcount: 38, fields: { [key]: "Offsite" } } }),
    });
    expect(updated).toMatchObject({ guaranteedHeadcount: 38, fields: { [key]: "Offsite" } });
    const start = ticket.desiredStartsAt ?? new Date();
    const backwards = await update({ input: { desiredEndsAt: new Date(start.getTime() - 1) } });
    expect(backwards.ok ? null : backwards.error.issues[0]?.path).toBe("desiredEndsAt");
    const other = await createTestCustomer({ context, name: "Other AB" });
    const elsewhere = await createTestContact({ context, customerId: other.id });
    const wrong = await update({ input: { contactId: elsewhere.id } });
    expect(wrong.ok ? null : wrong.error.issues[0]?.path).toBe("contactId");
    const ticketStatus = await update({ input: { statusId: "x" } });
    expect(unwrap({ result: ticketStatus }).statusId).toBe(ticket.statusId);
  });

  it("refuses an unknown customer, a type of another base and unknown fields", async () => {
    const { context, type, customer } = await ticketSetup();
    const base = { entityTypeId: type.id, customerId: customer.id };
    const issue = async ({ input }: { input: Record<string, unknown> }) => {
      const result = await execute({ operation: createTicket, input, context });
      return result.ok ? null : result.error.issues[0]?.path;
    };
    expect(await issue({ input: { ...base, customerId: "missing" } })).toBe("customerId");
    expect(await issue({ input: { ...base, entityTypeId: customer.entityTypeId } })).toBe(
      "entityTypeId",
    );
    expect(await issue({ input: { ...base, fields: { nope: 1 } } })).toBe("fields.nope");
  });

  it("filters the list by customer and status and never shows another organization's", async () => {
    const { context, type, customer } = await ticketSetup();
    const otherCustomer = await createTestCustomer({ context, name: "Kvarnby Design AB" });
    const ticket = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    await createTestTicket({ context, entityTypeId: type.id, customerId: otherCustomer.id });
    const list = ({ input }: { input: Record<string, unknown> }) =>
      execute({ operation: listTickets, input, context });
    const byCustomer = unwrap({ result: await list({ input: { customerId: customer.id } }) });
    expect(byCustomer.items.map((item) => item.id)).toEqual([ticket.id]);
    const byStatus = unwrap({ result: await list({ input: { statusId: ticket.statusId } }) });
    expect(byStatus.items).toHaveLength(2);
    const other = testContext();
    const get = await execute({ operation: getTicket, input: { id: ticket.id }, context: other });
    expect(errorCode({ result: get })).toBe("NOT_FOUND");
    const none = unwrap({
      result: await execute({ operation: listTickets, input: {}, context: other }),
    });
    expect(none.items).toEqual([]);
  });

  it("exports a versioned json document, only within the organization", async () => {
    const { context, type, customer } = await ticketSetup();
    const ticket = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const exported = unwrap({
      result: await execute({ operation: exportTicket, input: { id: ticket.id }, context }),
    });
    expect(exported).toMatchObject({ filename: "ticket-1.json", mime: "application/json" });
    const document = JSON.parse(exported.content);
    expect(document).toMatchObject({ schemaVersion: 1, ticket: { id: ticket.id } });
    expect(document.ticketStatus.name).toBe("Lead");
    const outside = await execute({
      operation: exportTicket,
      input: { id: ticket.id },
      context: testContext(),
    });
    expect(errorCode({ result: outside })).toBe("NOT_FOUND");
  });
});
