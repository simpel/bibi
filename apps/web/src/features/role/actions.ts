"use server";

import {
  archiveRole,
  createRole,
  importRoleTemplate,
  type RoleCreateInput,
  type RoleDto,
  type RoleUpdateInput,
  updateRole,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateRoleActionInput = { input: RoleCreateInput };
export type UpdateRoleActionInput = { input: RoleUpdateInput };
export type ArchiveRoleActionInput = { id: string };
export type ImportRoleTemplateResult = { created: RoleDto[]; skipped: string[] };

export async function createRoleAction({
  input,
}: CreateRoleActionInput): Promise<ActionResult<RoleDto>> {
  return toActionResult({ result: await runOperation({ operation: createRole, input }) });
}

export async function updateRoleAction({
  input,
}: UpdateRoleActionInput): Promise<ActionResult<RoleDto>> {
  return toActionResult({ result: await runOperation({ operation: updateRole, input }) });
}

export async function archiveRoleAction({
  id,
}: ArchiveRoleActionInput): Promise<ActionResult<RoleDto>> {
  return toActionResult({ result: await runOperation({ operation: archiveRole, input: { id } }) });
}

/** Imports the "Konferensgård" role template; existing names are skipped. */
export async function importRoleTemplateAction(): Promise<ActionResult<ImportRoleTemplateResult>> {
  return toActionResult({
    result: await runOperation({
      operation: importRoleTemplate,
      input: { template: "conference-venue" },
    }),
  });
}
