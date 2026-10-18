import { z } from "zod";

/**
 * What a line in a state does to its bookable item (ADR 0044): `NONE` nothing, `SOFT` reserves
 * without blocking (soft holds may overlap), `HARD` blocks. Types without `BOOKABLE` use `NONE`.
 */
export const HOLD_KINDS = ["NONE", "SOFT", "HARD"] as const;
export const HoldKindSchema = z.enum(HOLD_KINDS);
export type HoldKind = z.infer<typeof HoldKindSchema>;
