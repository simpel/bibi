import { z } from "zod";

/** Soft-delete status of org-scoped business rows (ADR 0006). */
export const RecordStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);
