import { z } from "zod";
import { parseIsoDate, toIsoDate } from "./plain-date";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Whether `value` is a real `YYYY-MM-DD` date (not 2026-02-30). */
export const isIsoDate = ({ value }: { value: string }): boolean =>
  ISO_DATE.test(value) && toIsoDate({ date: parseIsoDate({ value }) }) === value;

/** A plain date as `YYYY-MM-DD` (ADR 0064 decision 2); `parseIsoDate` turns it into a key. */
export const PlainDateStringSchema = z
  .string()
  .trim()
  .refine((value) => isIsoDate({ value }), { message: "Not a date (YYYY-MM-DD)" });
