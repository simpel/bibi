import { type Db, getDb } from "@bibi/db";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { VerifiedDelivery, VerifyWebhookInput, WebhookPort } from "../types";
import { readPaymentRequest, readRefund } from "./swish-api";
import { swishConfigured } from "./swish-config";
import { openSwishCredentials, type SwishCredentials } from "./swish-credentials";
import { refundSignals, requestSignals } from "./swish-signals";
import { type SwishCallback, SwishCallbackSchema } from "./swish-types";

const notACallback = () =>
  err({ error: new AppError({ code: "VALIDATION", message: "Not a Swish callback" }) });

function parseCallback({ payload }: { payload: string }): SwishCallback | null {
  try {
    const parsed = SwishCallbackSchema.safeParse(JSON.parse(payload));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

const isRefund = ({ callback }: { callback: SwishCallback }) =>
  "originalPaymentReference" in callback;

/**
 * The certificate of the venue the callback names (the one cross-organization lookup, ADR 0004),
 * or null for a Swish number Bibi does not know.
 */
async function credentialsFor({ db, alias }: { db: Db; alias: string }) {
  const row = await db.providerConnection.findFirst({
    where: { provider: "SWISH", externalAccountId: alias, disconnectedAt: null },
    select: { credentialsSealed: true },
  });
  return row?.credentialsSealed ? openSwishCredentials({ sealed: row.credentialsSealed }) : null;
}

type ReadInput = { credentials: SwishCredentials; callback: SwishCallback; alias: string };

/** The object read again over mTLS; its state, never the callback's, becomes the signals. */
async function reread({ credentials, callback, alias }: ReadInput) {
  const { id } = callback;
  if (isRefund({ callback })) {
    const refund = await readRefund({ credentials, id });
    if (!refund.ok) return refund;
    const signals =
      refund.value.payerAlias === alias ? refundSignals({ refund: refund.value }) : [];
    return ok({ value: { type: `refund.${refund.value.status}`, signals } });
  }
  const request = await readPaymentRequest({ credentials, id });
  if (!request.ok) return request;
  const own = request.value.payeeAlias === alias;
  const signals = own ? requestSignals({ request: request.value }) : [];
  return ok({ value: { type: `paymentrequest.${request.value.status}`, signals } });
}

/**
 * A Swish callback (ADR 0100). Callbacks are unsigned, so the body is trusted only for which
 * payment request or refund to read; Bibi reads it again from Swish with the venue's certificate
 * and builds the signals from that state. Unknown numbers and unfinished states yield no signals.
 */
export async function verifySwishCallback({
  payload,
  db = getDb(),
}: VerifyWebhookInput): Promise<Result<VerifiedDelivery>> {
  const callback = parseCallback({ payload });
  if (!callback) return notACallback();
  const alias = "payerAlias" in callback ? callback.payerAlias : callback.payeeAlias;
  const credentials = await credentialsFor({ db, alias });
  if (!credentials) return ok({ value: { eventId: callback.id, type: "unknown", signals: [] } });
  if (!credentials.ok) return credentials;
  const read = await reread({ credentials: credentials.value, callback, alias });
  if (!read.ok) return read;
  const eventId = read.value.signals[0]?.eventId ?? `${callback.id}:${read.value.type}`;
  return ok({ value: { eventId, ...read.value } });
}

export const swishWebhook: WebhookPort = {
  isConfigured: swishConfigured,
  verify: verifySwishCallback,
};
