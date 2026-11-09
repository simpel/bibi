import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type {
  AttemptRef,
  CollectPort,
  ProviderReference,
  RefundInput,
  StartAttemptInput,
} from "../types";
import {
  cancelPaymentRequest,
  createPaymentRequest,
  createRefund,
  readPaymentRequest,
} from "./swish-api";
import { SWISH_CURRENCY, SWISH_REQUEST_TTL_MS } from "./swish-config";
import { credentialsOf } from "./swish-credentials";
import { swishInstructionId } from "./swish-format";

const refuse = ({ message }: { message: string }) =>
  err({ error: new AppError({ code: "VALIDATION", message }) });

/** The app-switch link: Swish opens the request, then returns the customer to `returnUrl`. */
const appLink = ({ token, returnUrl }: { token: string; returnUrl: string }) =>
  `swish://paymentrequest?${new URLSearchParams({ token, callbackurl: returnUrl })}`;

/**
 * A Swish m-commerce payment request (ADR 0100): no payer number, so the customer opens it by
 * the app link on a phone or the QR token on a desktop. It expires in about three minutes.
 */
async function startAttempt({ auth, ...input }: StartAttemptInput): Promise<Result<AttemptRef>> {
  if (input.method !== "SWISH") return refuse({ message: `Swish does not take ${input.method}` });
  if (input.currency.toUpperCase() !== SWISH_CURRENCY) {
    return refuse({ message: `Swish takes SEK only, not ${input.currency}` });
  }
  if (input.amountMinor < 100) return refuse({ message: "Swish takes at least 1 SEK" });
  const credentials = credentialsOf({ auth });
  if (!credentials.ok) return credentials;
  const id = swishInstructionId({ key: input.idempotencyKey });
  const token = await createPaymentRequest({
    credentials: credentials.value,
    id,
    amountMinor: input.amountMinor,
    message: input.description,
    payeePaymentReference: input.metadata.paymentId ?? id,
  });
  if (!token.ok) return token;
  return ok({
    value: {
      providerReference: id,
      url: appLink({ token: token.value, returnUrl: input.successUrl }),
      qrToken: token.value,
      expiresAt: new Date(Date.now() + SWISH_REQUEST_TTL_MS),
    },
  });
}

async function cancelAttempt({
  auth,
  providerReference,
}: Parameters<CollectPort["cancelAttempt"]>[0]) {
  const credentials = credentialsOf({ auth });
  if (!credentials.ok) return credentials;
  return cancelPaymentRequest({ credentials: credentials.value, id: providerReference });
}

/**
 * Refunds a paid request (`payment.refund`): Swish refunds by the original's payment reference,
 * read again here. The payer reference carries Bibi's payment id so the callback finds it.
 */
async function refund({
  auth,
  providerReference,
  amountMinor,
  idempotencyKey,
  metadata,
}: RefundInput): Promise<Result<ProviderReference>> {
  const credentials = credentialsOf({ auth });
  if (!credentials.ok) return credentials;
  const original = await readPaymentRequest({
    credentials: credentials.value,
    id: providerReference,
  });
  if (!original.ok) return original;
  const paymentReference = original.value.paymentReference;
  if (original.value.status !== "PAID" || !paymentReference) {
    return err({
      error: new AppError({ code: "CONFLICT", message: "The Swish payment is not paid" }),
    });
  }
  const id = swishInstructionId({ key: idempotencyKey });
  const created = await createRefund({
    credentials: credentials.value,
    id,
    originalPaymentReference: paymentReference,
    amountMinor,
    payerPaymentReference: metadata.paymentId ?? id,
    message: "Refund",
  });
  return created.ok ? ok({ value: { providerReference: id } }) : created;
}

/** Swish Handel (ADR 0100): attempts start at the pay page, since requests expire in minutes. */
export const swishCollect: CollectPort = {
  methods: ["SWISH"],
  onDemand: true,
  startAttempt,
  cancelAttempt,
  refund,
};
