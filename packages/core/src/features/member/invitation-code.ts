import { randomInt } from "node:crypto";

/** No 0/O, 1/I/L: the code is read from an email and typed in by hand (ADR 0078). */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LENGTH = 8;

/** A new invite code, e.g. `K7M2QX9P`; unique by the database index, ~10^11 combinations. */
export function newInvitationCode(): string {
  return Array.from({ length: LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

export type NormalizeInvitationCodeInput = { code: string };

/** What a person typed, as stored: upper case, without spaces or dashes. */
export function normalizeInvitationCode({ code }: NormalizeInvitationCodeInput): string {
  return code.replace(/[\s-]/g, "").toUpperCase();
}
