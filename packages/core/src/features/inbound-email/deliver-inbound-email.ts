import { type Db, getDb } from "@bibi/db";
import { getLogger, maskEmail } from "@bibi/logger";
import { ok, type Result } from "../../errors/result";
import { createExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { grantAll } from "../../permissions/permission-set";
import { receiveInboundMessage } from "../inbound-message/receive-operation";
import type { InboundMessageDto } from "../inbound-message/schema";
import { toInboundMessageDto } from "../inbound-message/to-inbound-message-dto";
import { clampInboundMail } from "./clamp-inbound-mail";
import { resolveInboundRoute } from "./resolve-route";
import type { InboundEmailReceiveInput } from "./schema";
import { toReceiveInput } from "./to-receive-input";

export type InboundMailContent = Omit<InboundEmailReceiveInput, "orderId"> & {
  /** Every address the mail was delivered to (to, cc, received-for); matched in order. */
  recipients: readonly string[];
};

export type DeliverInboundEmailInput = {
  mail: InboundMailContent;
  /** The inbound subdomain the order and inbox addresses live on (`MAIL_INBOUND_DOMAIN`). */
  domain: string;
  db?: Db;
};

export type DeliverInboundEmailOutput =
  | { status: "stored" | "duplicate"; inboundMessage: InboundMessageDto }
  | { status: "unmatched" };

const systemContext = ({ db, organizationId }: { db: Db; organizationId: string }) =>
  createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({}),
    actor: { type: "system", userId: null },
    db,
  });

/**
 * The EMAIL channel adapter's core part (ADR 0012, 0085): a verified received mail is stored as an
 * EMAIL message as SYSTEM. An order's own address stores it on that order; an organization's inbox
 * address stores it in that organization's inbox, with no order. Mail to neither is logged
 * (`mail.unmatched`) and dropped. Logs `mail.received` with the sender masked; never the body.
 */
export async function deliverInboundEmail({
  mail: { recipients, ...mail },
  domain,
  db = getDb(),
}: DeliverInboundEmailInput): Promise<Result<DeliverInboundEmailOutput>> {
  const input = toReceiveInput({ mail: clampInboundMail({ mail }) });
  const fields = {
    providerEmailId: mail.providerEmailId,
    sender: maskEmail({ email: input.fromEmail ?? "" }),
  };
  const route = await resolveInboundRoute({ db, recipients, domain });
  if (!route) {
    getLogger().warn({ event: "mail.unmatched", ...fields });
    return ok({ value: { status: "unmatched" } });
  }
  const context = systemContext({ db, organizationId: route.organizationId });
  const where = { channel: "EMAIL" as const, externalId: mail.providerEmailId };
  const known = await context.db.inboundMessage.findFirst({ where });
  const stored = known
    ? ok({ value: toInboundMessageDto({ row: known }) })
    : await execute({
        operation: receiveInboundMessage,
        input: { ...input, endpointId: route.endpointId, orderId: route.orderId },
        context,
      });
  if (!stored.ok) return stored;
  const status = known ? "duplicate" : "stored";
  const inboundMessageId = stored.value.id;
  getLogger().info({ event: "mail.received", ...fields, ...route, inboundMessageId, status });
  return ok({ value: { status, inboundMessage: stored.value } });
}
