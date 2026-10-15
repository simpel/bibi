import { createHmac, timingSafeEqual } from "node:crypto";

/** Svix rejects deliveries older or newer than five minutes (replay protection). */
const TOLERANCE_SECONDS = 5 * 60;

export type VerifySvixSignatureInput = {
  headers: Headers;
  body: string;
  /** The endpoint's signing secret, `whsec_<base64>`. */
  secret: string;
  nowSeconds?: number;
};

export type SignSvixPayloadInput = { id: string; timestamp: string; body: string; secret: string };

/** `v1` signature of a payload: base64 HMAC-SHA256 over `id.timestamp.body`. */
export function signSvixPayload({ id, timestamp, body, secret }: SignSvixPayloadInput): string {
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  return createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");
}

function sameSignature({ a, b }: { a: string; b: string }): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Verifies the `svix-*` headers Resend signs webhooks with. */
export function verifySvixSignature({
  headers,
  body,
  secret,
  nowSeconds = Math.floor(Date.now() / 1000),
}: VerifySvixSignatureInput): boolean {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatures = headers.get("svix-signature");
  if (!id || !timestamp || !signatures) return false;
  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(nowSeconds - sentAt) > TOLERANCE_SECONDS) return false;
  const expected = signSvixPayload({ id, timestamp, body, secret });
  return signatures
    .split(" ")
    .map((entry) => entry.split(","))
    .some(
      ([version, signature]) =>
        version === "v1" && sameSignature({ a: signature ?? "", b: expected }),
    );
}
