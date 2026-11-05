import { getEnv } from "@bibi/config";
import { createId } from "@paralleldrive/cuid2";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { createExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { grantAll } from "../../permissions/permission-set";
import { notFound } from "../../shared/errors";
import { toReceiveInput } from "../inbound-email/to-receive-input";
import { receiveInboundMessage } from "./receive-operation";

export type SendTestInboxMessageInput = { organizationId: string };

/** Made-up booking requests; one is picked at random each time. */
const REQUESTS = [
  {
    from: "Sara Lund <sara.lund@example.test>",
    subject: "Kick-off for 25 in March",
    text: "Hi! We would like a meeting room and lunch for 25 people on 12 March, 9 to 16.",
  },
  {
    from: "Omar Haddad <omar@example.test>",
    subject: "Dinner after our conference",
    text: "Could you host a seated dinner for 60 guests on a Thursday in April? Three are vegetarian.",
  },
  {
    from: "Eva Berg <eva.berg@example.test>",
    subject: "Guided tour for a school class",
    text: "A guided tour for 28 pupils and 3 teachers next Tuesday at 10, with fika afterwards.",
  },
] as const;

/**
 * Development only (the dev menu): a mail to the organization's inbox address with a random
 * booking request, stored through `inboundMessage.receive` like the mail webhook, so the stream,
 * the badge and the toast react. Refuses production.
 */
export async function sendTestInboxMessage({
  organizationId,
}: SendTestInboxMessageInput): Promise<Result<{ id: string }>> {
  if (getEnv().NODE_ENV === "production") {
    return err({ error: new AppError({ code: "FORBIDDEN", message: "Dev only" }) });
  }
  const context = createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({}),
    actor: { type: "system", userId: null },
  });
  const endpoint = await context.db.inboundEndpoint.findFirst({ where: { channel: "EMAIL" } });
  if (!endpoint) return notFound({ entity: "Inbox address" });
  const request = REQUESTS[Math.floor(Math.random() * REQUESTS.length)] ?? REQUESTS[0];
  const key = createId();
  const mail = toReceiveInput({
    mail: {
      providerEmailId: `dev_${key}`,
      messageId: `<${key}@dev.bibi.test>`,
      fromAddress: request.from,
      toAddresses: [`${endpoint.address}@in.bibi.test`],
      subject: request.subject,
      text: request.text,
      html: null,
      attachments: [],
      receivedAt: new Date(),
    },
  });
  const input = { ...mail, endpointId: endpoint.id, orderId: null };
  const stored = await execute({ operation: receiveInboundMessage, input, context });
  return stored.ok ? ok({ value: { id: stored.value.id } }) : stored;
}
