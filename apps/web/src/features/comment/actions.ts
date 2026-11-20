"use server";

import {
  archiveComment,
  type CommentCreateInput,
  type CommentDto,
  type CommentUpdateInput,
  createComment,
  updateComment,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateCommentActionInput = { input: CommentCreateInput };
export type UpdateCommentActionInput = { input: CommentUpdateInput };
export type ArchiveCommentActionInput = { id: string };

export async function createCommentAction({
  input,
}: CreateCommentActionInput): Promise<ActionResult<CommentDto>> {
  return toActionResult({ result: await runOperation({ operation: createComment, input }) });
}

export async function updateCommentAction({
  input,
}: UpdateCommentActionInput): Promise<ActionResult<CommentDto>> {
  return toActionResult({ result: await runOperation({ operation: updateComment, input }) });
}

export async function archiveCommentAction({
  id,
}: ArchiveCommentActionInput): Promise<ActionResult<CommentDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveComment, input: { id } }),
  });
}
