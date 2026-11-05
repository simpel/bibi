import { z } from "zod";

/**
 * Valid characters for phone numbers: optional leading '+', digits, spaces, hyphens, and parentheses.
 * Note: '+' is strictly limited to the leading position (index 0).
 */
const PHONE_PATTERN = /^\+?[0-9\s\-()]+$/;

const MIN_PHONE_DIGITS = 6;
const MAX_PHONE_DIGITS = 15;

/**
 * Validates a phone number as people type it (ITU-T E.164 compliant: 6–15 digits).
 * Allows optional leading '+', spaces, hyphens and balanced parentheses.
 * Rejects letters, symbols, misplaced plus signs, and out-of-range digit lengths.
 */
export const PhoneSchema = z
  .string()
  .trim()
  .min(6, { message: "Phone number is too short" })
  .max(30, { message: "Phone number is too long" })
  .regex(PHONE_PATTERN, { message: "Use digits, spaces, +, - and parentheses" })
  .refine(
    (val) => {
      const digits = val.replace(/\D/g, "");
      return digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS;
    },
    {
      message: `Phone number must contain between ${MIN_PHONE_DIGITS} and ${MAX_PHONE_DIGITS} digits`,
    },
  )
  .refine(
    (val) => {
      // Must not end or start with a dangling hyphen
      if (val.startsWith("-") || val.endsWith("-")) return false;
      // Balanced parentheses if present
      const opens = (val.match(/\(/g) ?? []).length;
      const closes = (val.match(/\)/g) ?? []).length;
      return opens === closes;
    },
    { message: "Invalid phone number format" },
  )
  .describe("Phone number, e.g. +46 31 123 45 67");
