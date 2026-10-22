"use server";

import {
  archiveTicketTemplate,
  createTicketTemplate,
  type TicketTemplateCreateInput,
  type TicketTemplateDto,
  type TicketTemplateUpdateInput,
  updateTicketTemplate,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateTicketTemplateActionInput = { input: TicketTemplateCreateInput };
export type UpdateTicketTemplateActionInput = { input: TicketTemplateUpdateInput };
export type ArchiveTicketTemplateActionInput = { id: string };

export async function createTicketTemplateAction({
  input,
}: CreateTicketTemplateActionInput): Promise<ActionResult<TicketTemplateDto>> {
  return toActionResult({ result: await runOperation({ operation: createTicketTemplate, input }) });
}

export async function updateTicketTemplateAction({
  input,
}: UpdateTicketTemplateActionInput): Promise<ActionResult<TicketTemplateDto>> {
  return toActionResult({ result: await runOperation({ operation: updateTicketTemplate, input }) });
}

export async function archiveTicketTemplateAction({
  id,
}: ArchiveTicketTemplateActionInput): Promise<ActionResult<TicketTemplateDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveTicketTemplate, input: { id } }),
  });
}
