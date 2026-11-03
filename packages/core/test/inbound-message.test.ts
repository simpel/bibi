import { describe, expect, it } from "vitest";
import { ticketInboundAddress } from "../src/features/inbound-email/address";
import {
  attachInboundMessage,
  countOpenInboundMessages,
  deleteInboundMessage,
  type ExecuteContext,
  execute,
  getInboundMessage,
  listInboundMessages,
  markInboundMessageRead,
  markInboundMessageUnread,
} from "../src/index";
import { errorCode, peer, unwrap } from "./helpers";
import { INBOX_DOMAIN, inboxSetup, mailTo, withPermissions } from "./inbound-message-helpers";
import { createTestTicket } from "./ticket-helpers";

const inboxIds = async ({ context, read }: { context: ExecuteContext; read?: boolean }) => {
  const input = read === undefined ? {} : { read };
  const page = unwrap({
    result: await execute({ operation: listInboundMessages, input, context }),
  });
  return page.items.map((item) => item.id);
};

describe("the EMAIL channel into the inbox (ADR 0085)", () => {
  it("stores mail to the organization address in its inbox, without a ticket", async () => {
    const { context, email, address } = await inboxSetup();
    const message = await mailTo({ recipients: [address] });
    expect(message).toMatchObject({
      organizationId: context.organizationId,
      channel: "EMAIL",
      endpointId: email.id,
      ticketId: null,
      fromName: "Guest",
      fromEmail: "guest@example.test",
      text: "We will be 40 guests.",
    });
    expect(await inboxIds({ context: context })).toEqual([message.id]);
    const got = await execute({ operation: getInboundMessage, input: { id: message.id }, context });
    expect(unwrap({ result: got }).subject).toBe("Re: your ticket");
  });

  it("stores a reply on the ticket when the ticket address is among the recipients", async () => {
    const { context, type, customer, address } = await inboxSetup();
    const ticket = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const reply = ticketInboundAddress({ ticketId: ticket.id, domain: INBOX_DOMAIN });
    const message = await mailTo({ recipients: [address, reply] });
    expect(message.ticketId).toBe(ticket.id);
    expect(await inboxIds({ context: context })).toEqual([]);
    const input = { ticketId: ticket.id };
    const page = unwrap({
      result: await execute({ operation: listInboundMessages, input, context }),
    });
    expect(page.items.map((item) => item.id)).toEqual([message.id]);
  });

  it("needs ticket:read to list a ticket's messages", async () => {
    const { context } = await inboxSetup();
    const result = await execute({
      operation: listInboundMessages,
      input: { ticketId: "any" },
      context: withPermissions({ of: context, permissions: { inbox: ["read"] } }),
    });
    expect(errorCode({ result })).toBe("VALIDATION");
  });
});

describe("handling the inbox", () => {
  it("marks a message read and unread for the whole team", async () => {
    const { context, address } = await inboxSetup();
    const message = await mailTo({ recipients: [address] });
    const member = peer({ of: context, access: "read" });
    const input = { id: message.id };
    const openCount = async () =>
      unwrap({
        result: await execute({ operation: countOpenInboundMessages, input: {}, context }),
      }).open;
    expect(await openCount()).toBe(1);
    const read = await execute({ operation: markInboundMessageRead, input, context: member });
    expect(unwrap({ result: read }).readAt).toBeInstanceOf(Date);
    expect(await inboxIds({ context, read: false })).toEqual([]);
    expect(await inboxIds({ context, read: true })).toEqual([message.id]);
    expect(await openCount()).toBe(0);
    unwrap({ result: await execute({ operation: markInboundMessageUnread, input, context }) });
    expect(await inboxIds({ context, read: false })).toEqual([message.id]);
    expect(await openCount()).toBe(1);
  });

  it("deletes a message by archiving it, and no longer lists or finds it", async () => {
    const { context, address } = await inboxSetup();
    const message = await mailTo({ recipients: [address] });
    const input = { id: message.id };
    const member = peer({ of: context, access: "read" });
    unwrap({ result: await execute({ operation: deleteInboundMessage, input, context: member }) });
    expect(await inboxIds({ context })).toEqual([]);
    const got = await execute({ operation: getInboundMessage, input, context });
    expect(errorCode({ result: got })).toBe("NOT_FOUND");
  });

  it("attaches a message to a ticket once", async () => {
    const { context, type, customer, address } = await inboxSetup();
    const ticket = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const other = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const message = await mailTo({ recipients: [address] });
    const attach = ({ ticketId }: { ticketId: string }) =>
      execute({ operation: attachInboundMessage, input: { id: message.id, ticketId }, context });
    expect(unwrap({ result: await attach({ ticketId: ticket.id }) }).ticketId).toBe(ticket.id);
    expect(errorCode({ result: await attach({ ticketId: other.id }) })).toBe("CONFLICT");
    const removed = await execute({
      operation: deleteInboundMessage,
      input: { id: message.id },
      context,
    });
    expect(errorCode({ result: removed })).toBe("CONFLICT");
  });

  it("needs ticket:write to attach, and refuses unknown tickets", async () => {
    const { context, address } = await inboxSetup();
    const message = await mailTo({ recipients: [address] });
    const input = { id: message.id, ticketId: "nope" };
    const member = peer({ of: context, access: "read" });
    const denied = await execute({ operation: attachInboundMessage, input, context: member });
    expect(errorCode({ result: denied })).toBe("VALIDATION");
    const unknown = await execute({ operation: attachInboundMessage, input, context });
    expect(errorCode({ result: unknown })).toBe("VALIDATION");
  });
});
