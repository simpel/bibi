import { randomBytes } from "node:crypto";
import { z } from "zod";

const TOKEN_BYTES = 32;

/** 32 random bytes as base64url: 43 characters, 256 bits, safe in a URL path. */
export const PublicTokenSchema = z
  .string()
  .length(43)
  .regex(/^[A-Za-z0-9_-]+$/);

/** The unguessable part of the public payment page URL (ADR 0028). */
export function newPublicToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}
