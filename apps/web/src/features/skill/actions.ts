"use server";

import {
  archiveSkill,
  createSkill,
  exportSkill,
  importSkill,
  publishSkill,
  type SkillDto,
  shareSkill,
  updateSkill,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";
import type { SkillCreateInput, SkillScopeChoice, SkillUpdateInput } from "./skill-types";

export type SkillIdActionInput = { id: string };
export type CreateSkillActionInput = { input: SkillCreateInput };
export type UpdateSkillActionInput = { input: SkillUpdateInput };
export type ImportSkillActionInput = { markdown: string; scope: SkillScopeChoice };
export type ExportedSkill = { markdown: string; filename: string };

export async function createSkillAction({
  input,
}: CreateSkillActionInput): Promise<ActionResult<SkillDto>> {
  return toActionResult({ result: await runOperation({ operation: createSkill, input }) });
}

export async function updateSkillAction({
  input,
}: UpdateSkillActionInput): Promise<ActionResult<SkillDto>> {
  return toActionResult({ result: await runOperation({ operation: updateSkill, input }) });
}

export async function publishSkillAction({
  id,
}: SkillIdActionInput): Promise<ActionResult<SkillDto>> {
  return toActionResult({ result: await runOperation({ operation: publishSkill, input: { id } }) });
}

export async function archiveSkillAction({
  id,
}: SkillIdActionInput): Promise<ActionResult<SkillDto>> {
  return toActionResult({ result: await runOperation({ operation: archiveSkill, input: { id } }) });
}

/** Personal → organization: copies the skill into the organization as a draft (admin only). */
export async function shareSkillAction({
  id,
}: SkillIdActionInput): Promise<ActionResult<SkillDto>> {
  return toActionResult({ result: await runOperation({ operation: shareSkill, input: { id } }) });
}

export async function importSkillAction({
  markdown,
  scope,
}: ImportSkillActionInput): Promise<ActionResult<SkillDto>> {
  const input = { markdown, scope };
  return toActionResult({ result: await runOperation({ operation: importSkill, input }) });
}

/** SKILL.md text and suggested file name of a skill (for the browser download). */
export async function exportSkillAction({
  id,
}: SkillIdActionInput): Promise<ActionResult<ExportedSkill>> {
  return toActionResult({ result: await runOperation({ operation: exportSkill, input: { id } }) });
}
