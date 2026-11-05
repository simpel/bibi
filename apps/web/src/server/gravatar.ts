import "server-only";
import { createHash } from "node:crypto";

export type GravatarUrlInput = {
  email: string;
  size?: number;
};

/**
 * Returns a Gravatar URL for the given email (ADR 0063 / Gravatar standard: SHA-256).
 * Uses `d=404` so the client can detect whether a custom gravatar actually exists.
 */
export function gravatarUrl({ email, size = 192 }: GravatarUrlInput): string {
  const clean = email.trim().toLowerCase();
  if (!clean) return "";
  const hash = createHash("sha256").update(clean).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`;
}
