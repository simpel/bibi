import { createHmac } from "node:crypto";
import { createId } from "@paralleldrive/cuid2";
import {
  createPayment,
  createStripeWebhookHandler,
  execute,
  setTicketPhaseTransitions,
} from "../src/index";
import { unwrap } from "./helpers";
import { paymentSetup, sentDeposit } from "./payment-helpers";
import { createTestTicket, memberUser } from "./ticket-helpers";
import { phaseByName } from "./ticket-phase-helpers";

export const SECRET = "whsec_test_secret";

export type StripeEventInput = {
  type: string;
  account?: string;
  object?: Record<string, unknown>;
  id?: string;
};

export const stripeEvent = ({ type, account, object = {}, id }: StripeEventInput) => ({
  id: id ?? `evt_${createId()}`,
  type,
  ...(account ? { account } : {}),
  data: { object },
});

export type SignInput = { body: string; secret?: string; timestamp?: number };

export function sign({
  body,
  secret = SECRET,
  timestamp = Math.floor(Date.now() / 1000),
}: SignInput) {
  const digest = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${digest}`;
}

export type PostInput = { event: unknown; secret?: string; header?: string | null };

/** Delivers an event to the webhook handler the way Stripe does: raw body plus signature. */
export async function postEvent({ event, secret = SECRET, header }: PostInput) {
  const body = JSON.stringify(event);
  const signature = header === undefined ? sign({ body, secret }) : header;
  const request = new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body,
    headers: signature ? { "stripe-signature": signature } : {},
  });
  const response = await createStripeWebhookHandler({ secret: SECRET })(request);
  return { status: response.status, body: (await response.json()) as { status?: string } };
}

/** A paid-for-able card payment on a ticket whose Lead phase may move to Confirmed. */
export async function webhookSetup() {
  const setup = await paymentSetup();
  const { context } = setup;
  const lead = await phaseByName({ context, name: "Lead" });
  const confirmed = await phaseByName({ context, name: "Confirmed" });
  unwrap({
    result: await execute({
      operation: setTicketPhaseTransitions,
      input: { id: lead.id, toPhaseIds: [confirmed.id] },
      context,
    }),
  });
  return { ...setup, confirmed };
}

type SetupInput = { coordinated: boolean };

/** A pending card payment; `coordinated` decides whether the ticket may be confirmed. */
export async function pendingPayment({ coordinated }: SetupInput) {
  const setup = await webhookSetup();
  const { context } = setup;
  const ticketId = coordinated
    ? (
        await createTestTicket({
          context,
          entityTypeId: (
            await context.db.ticket.findUniqueOrThrow({ where: { id: setup.ticketId } })
          ).entityTypeId,
          customerId: setup.customerId,
          assigneeId: await memberUser({ context, name: "Coordinator" }),
        })
      ).id
    : setup.ticketId;
  const depositId = coordinated ? (await sentDeposit({ context, ticketId })).id : setup.depositId;
  const payment = unwrap({
    result: await execute({
      operation: createPayment,
      input: { depositId, method: "CARD", amountMinor: 125_000 },
      context,
    }),
  });
  const account = setup.account.stripeAccountId ?? "";
  // Executed, so Stripe has already been asked and the reference is set (ADR 0058).
  const reference = payment.providerReference ?? "";
  return { ...setup, ticketId, payment: { ...payment, providerReference: reference }, account };
}

export const paidEvent = ({ account, reference }: { account: string; reference: string }) =>
  stripeEvent({
    type: "checkout.session.completed",
    account,
    object: { id: reference, payment_status: "paid" },
  });
