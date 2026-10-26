"use server";

import { AppError, err } from "@bibi/core";
import { PlainDateStringSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { toActionResult } from "@/server/to-action-result";
import { loadTicketDay, type TicketDay } from "./load-ticket-day";

const InputSchema = z.object({ ticketId: z.string().min(1), date: PlainDateStringSchema });

/** A booking's ticket on its day, read when the booking sheet opens. */
export async function loadTicketDayAction({
  ticketId,
  date,
}: {
  ticketId: string;
  date: string;
}): Promise<ActionResult<TicketDay>> {
  const parsed = InputSchema.safeParse({ ticketId, date });
  if (!parsed.success) {
    const error = new AppError({ code: "VALIDATION", message: "Invalid ticket day" });
    return toActionResult({ result: err({ error }) });
  }
  return toActionResult({ result: await loadTicketDay(parsed.data) });
}
