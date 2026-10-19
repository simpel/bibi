import { type Db, getDb } from "@okazi/db";
import { getLogger, maskEmail } from "@okazi/logger";
import { ok, type Result } from "../../errors/result";
import { createExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { grantAll } from "../../permissions/permission-set";
import { bareAddress } from "./address";
import { clampInboundMail } from "./clamp-inbound-mail";
import { receiveInboundEmail } from "./receive-operation";
import { resolveInboundTicket } from "./resolve-ticket";
import type { InboundEmailDto, InboundEmailReceiveInput } from "./schema";
import { toInboundEmailDto } from "./to-inbound-email-dto";

export type InboundMailContent = Omit<InboundEmailReceiveInput, "ticketId"> & {
  /** Every address the mail was delivered to (to, cc, received-for); matched in order. */
  recipients: readonly string[];
};

export type DeliverInboundEmailInput = {
  mail: InboundMailContent;
  /** The inbound subdomain the ticket addresses live on (`MAIL_INBOUND_DOMAIN`). */
  domain: string;
  db?: Db;
};

export type DeliverInboundEmailOutput =
  | { status: "stored" | "duplicate"; inboundEmail: InboundEmailDto }
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
 * Stores a verified received mail on the ticket its address names (ADR 0012), as SYSTEM in that
 * ticket's organization. Mail to no known ticket is logged (`mail.unmatched`) and dropped.
 * Logs `mail.received` with the sender masked; never the body.
 */
export async function deliverInboundEmail({
  mail: { recipients, ...mail },
  domain,
  db = getDb(),
}: DeliverInboundEmailInput): Promise<Result<DeliverInboundEmailOutput>> {
  const sender = maskEmail({ email: bareAddress({ address: mail.fromAddress }) });
  const fields = { providerEmailId: mail.providerEmailId, sender };
  const ref = await resolveInboundTicket({ db, recipients, domain });
  if (!ref) {
    getLogger().warn({ event: "mail.unmatched", ...fields });
    return ok({ value: { status: "unmatched" } });
  }
  const context = systemContext({ db, organizationId: ref.organizationId });
  const where = { providerEmailId: mail.providerEmailId };
  const known = await context.db.inboundEmail.findFirst({ where });
  const stored = known
    ? ok({ value: toInboundEmailDto({ row: known }) })
    : await execute({
        operation: receiveInboundEmail,
        input: { ...clampInboundMail({ mail }), ticketId: ref.ticketId },
        context,
      });
  if (!stored.ok) return stored;
  const status = known ? "duplicate" : "stored";
  const id = stored.value.id;
  getLogger().info({ event: "mail.received", ...fields, ...ref, inboundEmailId: id, status });
  return ok({ value: { status, inboundEmail: stored.value } });
}
