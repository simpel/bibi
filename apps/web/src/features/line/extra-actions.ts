"use server";

import {
  archiveLine,
  chooseLineOptions,
  createLine,
  type LineChooseOptionsInput,
  type LineDto,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

/** A pick beyond a group's max, made an add-on of the line at the item's own price. */
export type NewExtraPick = { itemId: string; name: string };

export type ChooseOptionsWithExtrasActionInput = {
  input: LineChooseOptionsInput;
  ticketId: string;
  /** Extra picks to add as add-ons (`line.create` with `parentLineId`). */
  create: readonly NewExtraPick[];
  /** Add-on lines of extra picks that were unpicked (`line.archive`). */
  archive: readonly string[];
};

/**
 * The ticket page's options form (ADR 0088 decision 5): `line.chooseOptions` with the picks up
 * to each group's max, then the extra picks as add-ons under the line, and unpicked extras
 * archived. Each step is its own audited operation; the first refusal stops the rest.
 */
export async function chooseOptionsWithExtrasAction({
  input,
  ticketId,
  create,
  archive,
}: ChooseOptionsWithExtrasActionInput): Promise<ActionResult<{ items: LineDto[] }>> {
  const chosen = await runOperation({ operation: chooseLineOptions, input });
  if (!chosen.ok) return toActionResult({ result: chosen });
  for (const id of archive) {
    const archived = await runOperation({ operation: archiveLine, input: { id } });
    if (!archived.ok) return toActionResult({ result: archived });
  }
  for (const { itemId, name } of create) {
    const addOn = { ticketId, parentLineId: input.lineId, itemId, name };
    const created = await runOperation({ operation: createLine, input: addOn });
    if (!created.ok) return toActionResult({ result: created });
  }
  return toActionResult({ result: chosen });
}
