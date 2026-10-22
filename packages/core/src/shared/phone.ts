import { z } from "zod";

/** Digits, spaces, `+`, `-` and parentheses, e.g. `+46 31-123 45 67`. */
const PHONE_PATTERN = /^[0-9+\-() ]+$/;

/** A phone number as people type it (trimmed, 6–30 characters); one rule for every phone field. */
export const PhoneSchema = z
  .string()
  .trim()
  .min(6)
  .max(30)
  .regex(PHONE_PATTERN, { message: "Use digits, spaces, +, - and parentheses" })
  .describe("Phone number, e.g. +46 31 123 45 67");
