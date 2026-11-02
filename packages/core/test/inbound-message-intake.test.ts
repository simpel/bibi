import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import {
  applyOverrides,
  createExecuteContext,
  createTicket,
  execute,
  listInboundMessages,
  PRESET_PERMISSIONS,
  submitInboundMessage,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { inboxSetup, mailTo, withPermissions } from "./inbound-message-helpers";
import { contactAt } from "./ticket-helpers";

describe("ticket.create from an inbox message (ADR 0081, 0085)", () => {
  it("attaches the message to the new ticket, once", async () => {
    const { context, type, customer, address } = await inboxSetup();
    const message = await mailTo({ recipients: [address] });
    const contact = await contactAt({ context, customerId: customer.id });
    const input = {
      entityTypeId: type.id,
      customerId: customer.id,
      contactId: contact.id,
      inboundMessageId: message.id,
    };
    const ticket = unwrap({ result: await execute({ operation: createTicket, input, context }) });
    const page = unwrap({
      result: await execute({
        operation: listInboundMessages,
        input: { ticketId: ticket.id },
        context,
      }),
    });
    expect(page.items.map((item) => item.id)).toEqual([message.id]);
    const before = await context.db.ticket.count({});
    const again = await execute({ operation: createTicket, input, context });
    expect(errorCode({ result: again })).toBe("CONFLICT");
    expect(await context.db.ticket.count({})).toBe(before);
  });

  it("needs inbox:read for the message", async () => {
    const { context, type, customer, address } = await inboxSetup();
    const message = await mailTo({ recipients: [address] });
    const contact = await contactAt({ context, customerId: customer.id });
    const permissions = { ...context.permissions, inbox: [] };
    const result = await execute({
      operation: createTicket,
      input: {
        entityTypeId: type.id,
        customerId: customer.id,
        contactId: contact.id,
        inboundMessageId: message.id,
      },
      context: withPermissions({ of: context, permissions }),
    });
    expect(errorCode({ result })).toBe("VALIDATION");
  });
});

describe("inboundMessage.submit (the API channel)", () => {
  it("stores an API message from the caller without letting it read the inbox", async () => {
    const { context, api } = await inboxSetup();
    const caller = createExecuteContext({
      organizationId: context.organizationId,
      roles: [],
      permissions: { inbox: ["submit"] },
      actor: { type: "apiKey", userId: null, apiKeyId: `key_${createId()}` },
    });
    const input = { endpointId: api.id, subject: "Tasting", text: "A tasting for 14 on the 21st" };
    const message = unwrap({
      result: await execute({ operation: submitInboundMessage, input, context: caller }),
    });
    expect(message).toMatchObject({ channel: "API", ticketId: null, endpointId: api.id });
    const listed = await execute({ operation: listInboundMessages, input: {}, context: caller });
    expect(errorCode({ result: listed })).toBe("FORBIDDEN");
    const inbox = unwrap({
      result: await execute({ operation: listInboundMessages, input: {}, context }),
    });
    expect(inbox.items.map((item) => item.id)).toEqual([message.id]);
  });

  it("refuses the EMAIL endpoint, members and Bibi's assistant", async () => {
    const { context, email, api } = await inboxSetup();
    const text = "Hello";
    const viaEmail = await execute({
      operation: submitInboundMessage,
      input: { endpointId: email.id, text },
      context,
    });
    expect(errorCode({ result: viaEmail })).toBe("VALIDATION");
    const member = withPermissions({ of: context, permissions: PRESET_PERMISSIONS.member });
    const input = { endpointId: api.id, text };
    const denied = await execute({ operation: submitInboundMessage, input, context: member });
    expect(errorCode({ result: denied })).toBe("FORBIDDEN");
    const actor = { type: "ai" as const, userId: "user_ai", conversationId: "c", approvedBy: "u" };
    const ai = await execute({
      operation: submitInboundMessage,
      input,
      context: { ...context, actor },
    });
    expect(errorCode({ result: ai })).toBe("FORBIDDEN");
  });
});

describe("inbox permissions (ADR 0085)", () => {
  it("gives members read and write, and submit only to admins", () => {
    expect(PRESET_PERMISSIONS.member.inbox).toEqual(["read", "write"]);
    expect(PRESET_PERMISSIONS.manager.inbox).toEqual(["read", "write"]);
    expect(PRESET_PERMISSIONS.admin.inbox).toEqual(["read", "write", "submit"]);
  });

  it("keeps an allowed submit when read is denied", () => {
    const overrides = [
      { feature: "inbox", action: "submit", effect: "allow" },
      { feature: "inbox", action: "read", effect: "deny" },
    ];
    expect(applyOverrides({ preset: "member", overrides }).inbox).toEqual(["submit"]);
  });
});
