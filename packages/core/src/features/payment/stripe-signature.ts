import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";

/** How far a signed timestamp may differ from now (Stripe's default tolerance). */
export const SIGNATURE_TOLERANCE_SECONDS = 300;

export type VerifyStripeSignatureInput = {
  /** The raw request body, exactly as received. */
  payload: string;
  /** The `Stripe-Signature` header: `t=<unix seconds>,v1=<hex hmac>[,v1=...]`. */
  header: string | null;
  secret: string;
  now?: Date;
};

const invalidSignature = ({ message }: { message: string }) =>
  err({ error: new AppError({ code: "UNAUTHENTICATED", message }) });

function parseHeader({ header }: { header: string }) {
  const parts = header.split(",").map((part) => part.trim().split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.flatMap(([key, value]) => (key === "v1" && value ? [value] : []));
  return { timestamp: Number(timestamp), signatures };
}

function matches({ expected, candidate }: { expected: string; candidate: string }): boolean {
  const left = Buffer.from(expected, "hex");
  const right = Buffer.from(candidate, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Verifies a Stripe webhook signature (HMAC-SHA256 over `<t>.<payload>`, constant-time compare,
 * replay window). Any `v1` signature may match, so a rotated secret keeps working during rollover.
 */
export function verifyStripeSignature({
  payload,
  header,
  secret,
  now = new Date(),
}: VerifyStripeSignatureInput): Result<true> {
  if (!header) return invalidSignature({ message: "Missing Stripe-Signature header" });
  const { timestamp, signatures } = parseHeader({ header });
  if (!Number.isFinite(timestamp) || signatures.length === 0) {
    return invalidSignature({ message: "Malformed Stripe-Signature header" });
  }
  const age = Math.abs(now.getTime() / 1000 - timestamp);
  if (age > SIGNATURE_TOLERANCE_SECONDS) return invalidSignature({ message: "Stale signature" });
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const valid = signatures.some((candidate) => matches({ expected, candidate }));
  return valid ? ok({ value: true }) : invalidSignature({ message: "Signature mismatch" });
}
