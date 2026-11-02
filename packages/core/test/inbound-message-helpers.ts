import { deliverInboundEmail } from "../src/features/inbound-email/deliver-inbound-email";
import { type ExecuteContext, execute, listInboundEndpoints } from "../src/index";
import { unwrap } from "./helpers";
import { inboundMail } from "./inbound-email-helpers";
import { ticketSetup } from "./ticket-helpers";

export const INBOX_DOMAIN = "in.bibi.test";

/** A provisioned organization (with its EMAIL and API endpoints) and its inbox address. */
export async function inboxSetup() {
  const setup = await ticketSetup();
  const { items } = unwrap({
    result: await execute({ operation: listInboundEndpoints, input: {}, context: setup.context }),
  });
  const email = items.find((endpoint) => endpoint.channel === "EMAIL");
  const api = items.find((endpoint) => endpoint.channel === "API");
  if (!email || !api) throw new Error("Expected the provisioned endpoints");
  const address = `${setup.context.organizationId.toLowerCase()}@${INBOX_DOMAIN}`;
  return { ...setup, email, api, address };
}

export type MailToInput = { recipients: string[] };

/** Delivers a fresh mail to `recipients` and returns the stored message. */
export async function mailTo({ recipients }: MailToInput) {
  const mail = inboundMail({ recipients });
  const delivered = unwrap({ result: await deliverInboundEmail({ mail, domain: INBOX_DOMAIN }) });
  if (delivered.status === "unmatched") throw new Error("Expected the mail to be stored");
  return delivered.inboundMessage;
}

export type AsInput = { of: ExecuteContext; permissions: ExecuteContext["permissions"] };

/** The same caller with other permissions. */
export const withPermissions = ({ of, permissions }: AsInput): ExecuteContext => ({
  ...of,
  permissions,
});
