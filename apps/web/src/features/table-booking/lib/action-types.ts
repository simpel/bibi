import type {
  DiningServiceCreateInput,
  DiningServiceExceptionSetInputSchema,
} from "@bibi/core/schemas";
import type { z } from "zod";

/** A sitting as the form sends it: the season as local days, turned into instants on the server. */
export type SittingActionValues = Omit<
  DiningServiceCreateInput,
  "roomItemId" | "validFrom" | "validUntil"
> & { validFromDate: string | null; validUntilDate: string | null };

export type ExceptionSetInput = z.input<typeof DiningServiceExceptionSetInputSchema>;
