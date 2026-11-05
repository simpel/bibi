import { type CapturedLogs, captureLogs } from "@bibi/logger";
import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { orderInboundAddress } from "../src/features/inbound-email/address";
import { deliverInboundEmail } from "../src/features/inbound-email/deliver-inbound-email";
import { toReceiveInput } from "../src/features/inbound-email/to-receive-input";
import { receiveInboundMessage } from "../src/features/inbound-message/receive-operation";
import { execute, getInboundEmail, listInboundEmails } from "../src/index";
import { errorCode, peer, unwrap } from "./helpers";
import { inboundMail } from "./inbound-email-helpers";
import { createTestOrder, orderSetup } from "./order-helpers";

const domain = "in.bibi.test";

let logs: CapturedLogs;
beforeEach(() => {
  logs = captureLogs();
});
afterEach(() => logs.restore());

async function orderWithAddress() {
  const { context, type, customer } = await orderSetup();
  const order = await createTestOrder({
    context,
    entityTypeId: type.id,
    customerId: customer.id,
  });
  return { context, order, address: orderInboundAddress({ orderId: order.id, domain }) };
}

describe("deliverInboundEmail", () => {
  it("stores a reply on the right order and organization and logs mail.received", async () => {
    const { context, order, address } = await orderWithAddress();
    const mail = inboundMail({ recipients: ["someone@else.test", address] });
    const delivered = unwrap({ result: await deliverInboundEmail({ mail, domain }) });
    expect(delivered.status).toBe("stored");
    const page = unwrap({
      result: await execute({
        operation: listInboundEmails,
        input: { orderId: order.id },
        context: peer({ of: context, access: "read" }),
      }),
    });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      organizationId: context.organizationId,
      orderId: order.id,
      subject: "Re: your order",
      text: "We will be 40 guests.",
      attachments: [{ id: "att_1", filename: "menu.pdf", contentType: "application/pdf" }],
    });
    const [line] = logs.events({ event: "mail.received" });
    expect(line).toMatchObject({ orderId: order.id, sender: "***@example.test" });
    expect(JSON.stringify(line)).not.toContain("40 guests");
  });

  it("stores a redelivered webhook only once", async () => {
    const { context, order, address } = await orderWithAddress();
    const mail = inboundMail({ recipients: [address] });
    unwrap({ result: await deliverInboundEmail({ mail, domain }) });
    const again = unwrap({ result: await deliverInboundEmail({ mail, domain }) });
    expect(again.status).toBe("duplicate");
    const rows = await context.db.inboundMessage.findMany({ where: { orderId: order.id } });
    expect(rows).toHaveLength(1);
    // Expand phase (ADR 0085): the old table still gets the reply, with the same id.
    const legacy = await context.db.inboundEmail.findMany({ where: { orderId: order.id } });
    expect(legacy.map((row) => row.id)).toEqual(rows.map((row) => row.id));
    const audit = await context.db.auditLog.findMany({
      where: { operation: "inboundMessage.receive" },
    });
    expect(audit.map((row) => row.actorType)).toEqual(["SYSTEM"]);
  });

  it("drops mail to unknown or archived addresses and logs mail.unmatched", async () => {
    const unknown = orderInboundAddress({ orderId: createId(), domain });
    const mail = inboundMail({ recipients: [unknown, "order-x@elsewhere.test"] });
    const delivered = unwrap({ result: await deliverInboundEmail({ mail, domain }) });
    expect(delivered.status).toBe("unmatched");
    expect(logs.events({ event: "mail.unmatched" })).toHaveLength(1);
  });

  it("keeps the mail out of other organizations", async () => {
    const { order, address } = await orderWithAddress();
    const other = await orderSetup();
    unwrap({
      result: await deliverInboundEmail({ mail: inboundMail({ recipients: [address] }), domain }),
    });
    const stored = await other.context.db.inboundMessage.findMany({});
    expect(stored).toEqual([]);
    const listed = await execute({
      operation: listInboundEmails,
      input: { orderId: order.id },
      context: other.context,
    });
    expect(unwrap({ result: listed }).items).toEqual([]);
  });
});

describe("inboundEmail operations", () => {
  it("refuses inboundMessage.receive from a user", async () => {
    const { context, order } = await orderWithAddress();
    const { recipients: _recipients, ...mail } = inboundMail({ recipients: [] });
    const input = { ...toReceiveInput({ mail }), endpointId: null, orderId: order.id };
    const result = await execute({ operation: receiveInboundMessage, input, context });
    expect(errorCode({ result })).toBe("FORBIDDEN");
  });

  it("gets one mail and hides it from users without order:read", async () => {
    const { context, address } = await orderWithAddress();
    const mail = inboundMail({ recipients: [address] });
    const delivered = unwrap({ result: await deliverInboundEmail({ mail, domain }) });
    if (delivered.status === "unmatched") throw new Error("Expected the mail to be stored");
    const inboundEmail = delivered.inboundMessage;
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
