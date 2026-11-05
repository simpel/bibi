"use server";

import { AppError, err } from "@bibi/core";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { toActionResult } from "@/server/to-action-result";
import { loadOrderSheet, type OrderSheetData } from "./load-order-sheet";

const InputSchema = z.object({ id: z.string().min(1) });

/** The order sheet's content, read when it opens from the pipeline or the calendar. */
export async function loadOrderSheetAction({
  id,
}: {
  id: string;
}): Promise<ActionResult<OrderSheetData>> {
  const parsed = InputSchema.safeParse({ id });
  if (!parsed.success) {
    const error = new AppError({ code: "VALIDATION", message: "Invalid order" });
    return toActionResult({ result: err({ error }) });
  }
  return toActionResult({ result: await loadOrderSheet(parsed.data) });
}
