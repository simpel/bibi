"use server";

import {
  archiveEntityType,
  type ConfigurationImportResult,
  createEntityType,
  type EntityTypeDto,
  importConfigurationTemplate,
  updateEntityType,
} from "@bibi/core";
import type { EntityTypeCreateInputSchema, EntityTypeUpdateInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

type EntityTypeCreateInput = z.infer<typeof EntityTypeCreateInputSchema>;
type EntityTypeUpdateInput = z.infer<typeof EntityTypeUpdateInputSchema>;

export type CreateEntityTypeActionInput = { input: EntityTypeCreateInput };
export type UpdateEntityTypeActionInput = { input: EntityTypeUpdateInput };
export type ArchiveEntityTypeActionInput = { id: string };

export async function createEntityTypeAction({
  input,
}: CreateEntityTypeActionInput): Promise<ActionResult<EntityTypeDto>> {
  return toActionResult({ result: await runOperation({ operation: createEntityType, input }) });
}

export async function updateEntityTypeAction({
  input,
}: UpdateEntityTypeActionInput): Promise<ActionResult<EntityTypeDto>> {
  return toActionResult({ result: await runOperation({ operation: updateEntityType, input }) });
}

export async function archiveEntityTypeAction({
  id,
}: ArchiveEntityTypeActionInput): Promise<ActionResult<EntityTypeDto>> {
  const input = { id };
  return toActionResult({ result: await runOperation({ operation: archiveEntityType, input }) });
}

/** Imports the "Conference venue" starter pack; anything that already exists is skipped. */
export async function importConfigurationTemplateAction(): Promise<
  ActionResult<ConfigurationImportResult>
> {
  const input = { template: "conference-venue" } as const;
  return toActionResult({
    result: await runOperation({ operation: importConfigurationTemplate, input }),
  });
}
