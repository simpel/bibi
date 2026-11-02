"use server";

import { AppError, err } from "@bibi/core";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { toActionResult } from "@/server/to-action-result";
import { loadTicketSheet, type TicketSheetData } from "./load-ticket-sheet";

const InputSchema = z.object({ id: z.string().min(1) });

/** The ticket sheet's content, read when it opens from the pipeline or the calendar. */
export async function loadTicketSheetAction({
  id,
}: {
  id: string;
}): Promise<ActionResult<TicketSheetData>> {
  const parsed = InputSchema.safeParse({ id });
  if (!parsed.success) {
    const error = new AppError({ code: "VALIDATION", message: "Invalid ticket" });
    return toActionResult({ result: err({ error }) });
  }
  return toActionResult({ result: await loadTicketSheet(parsed.data) });
}
