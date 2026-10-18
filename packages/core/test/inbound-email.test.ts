import { type CapturedLogs, captureLogs } from "@okazi/logger";
import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  deliverInboundEmail,
  execute,
  getInboundEmail,
  listInboundEmails,
  receiveInboundEmail,
  ticketInboundAddress,
} from "../src/index";
import { errorCode, peer, unwrap } from "./helpers";
import { inboundMail } from "./inbound-email-helpers";
import { createTestTicket, ticketSetup } from "./ticket-helpers";

const domain = "in.okazi.test";

let logs: CapturedLogs;
beforeEach(() => {
  logs = captureLogs();
});
afterEach(() => logs.restore());

async function ticketWithAddress() {
  const { context, type, customer } = await ticketSetup();
  const ticket = await createTestTicket({
    context,
    entityTypeId: type.id,
    customerId: customer.id,
  });
  return { context, ticket, address: ticketInboundAddress({ ticketId: ticket.id, domain }) };
}

describe("deliverInboundEmail", () => {
  it("stores a reply on the right ticket and organization and logs mail.received", async () => {
    const { context, ticket, address } = await ticketWithAddress();
    const mail = inboundMail({ recipients: ["someone@else.test", address] });
    const delivered = unwrap({ result: await deliverInboundEmail({ mail, domain }) });
    expect(delivered.status).toBe("stored");
    const page = unwrap({
      result: await execute({
        operation: listInboundEmails,
        input: { ticketId: ticket.id },
        context: peer({ of: context, access: "read" }),
      }),
    });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      organizationId: context.organizationId,
      ticketId: ticket.id,
      subject: "Re: your ticket",
      text: "We will be 40 guests.",
      attachments: [{ id: "att_1", filename: "menu.pdf", contentType: "application/pdf" }],
    });
    const [line] = logs.events({ event: "mail.received" });
    expect(line).toMatchObject({ ticketId: ticket.id, sender: "***@example.test" });
    expect(JSON.stringify(line)).not.toContain("40 guests");
  });

  it("stores a redelivered webhook only once", async () => {
    const { context, ticket, address } = await ticketWithAddress();
    const mail = inboundMail({ recipients: [address] });
    unwrap({ result: await deliverInboundEmail({ mail, domain }) });
    const again = unwrap({ result: await deliverInboundEmail({ mail, domain }) });
    expect(again.status).toBe("duplicate");
    const rows = await context.db.inboundEmail.findMany({ where: { ticketId: ticket.id } });
    expect(rows).toHaveLength(1);
    const audit = await context.db.auditLog.findMany({
      where: { operation: "inboundEmail.receive" },
    });
    expect(audit.map((row) => row.actorType)).toEqual(["SYSTEM"]);
  });

  it("drops mail to unknown or archived addresses and logs mail.unmatched", async () => {
    const unknown = ticketInboundAddress({ ticketId: createId(), domain });
    const mail = inboundMail({ recipients: [unknown, "ticket-x@elsewhere.test"] });
    const delivered = unwrap({ result: await deliverInboundEmail({ mail, domain }) });
    expect(delivered.status).toBe("unmatched");
    expect(logs.events({ event: "mail.unmatched" })).toHaveLength(1);
  });

  it("keeps the mail out of other organizations", async () => {
    const { ticket, address } = await ticketWithAddress();
    const other = await ticketSetup();
    unwrap({
      result: await deliverInboundEmail({ mail: inboundMail({ recipients: [address] }), domain }),
    });
    const stored = await other.context.db.inboundEmail.findMany({});
    expect(stored).toEqual([]);
    const listed = await execute({
      operation: listInboundEmails,
      input: { ticketId: ticket.id },
      context: other.context,
    });
    expect(unwrap({ result: listed }).items).toEqual([]);
  });
});

describe("inboundEmail operations", () => {
  it("refuses inboundEmail.receive from a user", async () => {
    const { context, ticket } = await ticketWithAddress();
    const { recipients: _recipients, ...mail } = inboundMail({ recipients: [] });
    const result = await execute({
      operation: receiveInboundEmail,
      input: { ...mail, ticketId: ticket.id },
      context,
    });
    expect(errorCode({ result })).toBe("FORBIDDEN");
  });

  it("gets one mail and hides it from users without ticket:read", async () => {
    const { context, address } = await ticketWithAddress();
    const mail = inboundMail({ recipients: [address] });
    const delivered = unwrap({ result: await deliverInboundEmail({ mail, domain }) });
    if (delivered.status === "unmatched") throw new Error("Expected the mail to be stored");
    const { inboundEmail } = delivered;
    const got = await execute({
      operation: getInboundEmail,
      input: { id: inboundEmail.id },
      context,
    });
    expect(unwrap({ result: got }).id).toBe(inboundEmail.id);
    const denied = await execute({
      operation: getInboundEmail,
      input: { id: inboundEmail.id },
      context: { ...context, permissions: {} },
    });
    expect(errorCode({ result: denied })).toBe("FORBIDDEN");
  });
});
