import { randomUUID } from "node:crypto";

export const REQUEST_ID_HEADER = "x-request-id";

// Accept a caller's id only if it is short and harmless (no log injection, no PII-sized blobs).
const VALID_REQUEST_ID = /^[A-Za-z0-9._:-]{8,128}$/;

export type RequestIdFromInput = { headers: Headers };

/** Reuses a valid incoming `x-request-id` (correlation across services), else a new UUID. */
export function requestIdFrom({ headers }: RequestIdFromInput): string {
  const incoming = headers.get(REQUEST_ID_HEADER);
  return incoming && VALID_REQUEST_ID.test(incoming) ? incoming : randomUUID();
}
