import { ok, type Result } from "../../errors/result";
import type { RefundState, RefundStatusInput } from "../types";
import { readRefund } from "./swish-api";
import { credentialsOf } from "./swish-credentials";
import { swishInstructionId } from "./swish-format";

/**
 * GET `/api/v1/refunds/{instructionId}` (the refund retry job, ADR 0100): the id is derived from
 * Bibi's key, so even a refund whose call ended without an answer is found. PAID settles it,
 * ERROR fails it, a 404 is MISSING (Swish never received it), anything else is in progress.
 */
export async function swishRefundStatus({
  auth,
  idempotencyKey,
  refundReference,
}: RefundStatusInput): Promise<Result<RefundState>> {
  const credentials = credentialsOf({ auth });
  if (!credentials.ok) return credentials;
  const id = refundReference ?? swishInstructionId({ key: idempotencyKey });
  const read = await readRefund({ credentials: credentials.value, id });
  if (!read.ok) {
    return read.error.code === "NOT_FOUND" ? ok({ value: { status: "MISSING" } }) : read;
  }
  const { status, datePaid } = read.value;
  const occurredAt = datePaid ? new Date(datePaid) : new Date();
  if (status === "PAID")
    return ok({ value: { status: "SUCCEEDED", providerReference: id, occurredAt } });
  if (status === "ERROR")
    return ok({ value: { status: "FAILED", providerReference: id, occurredAt } });
  return ok({ value: { status: "PENDING", providerReference: id } });
}
