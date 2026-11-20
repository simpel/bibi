import { CommentSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a comment as tool results carry it (dates = ISO strings). */
export const CommentWireSchema = CommentSchema.extend({
  editedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const CommentListWireSchema = z.object({
  items: z.array(CommentWireSchema),
  nextCursor: z.string().nullable(),
});

export type CommentWire = z.infer<typeof CommentWireSchema>;

const commentList = uiEntry({
  component: "comment-list",
  schema: CommentListWireSchema,
  toProps: ({ value }) => value,
});
const commentCard = uiEntry({
  component: "comment-card",
  schema: CommentWireSchema,
  toProps: ({ value }) => ({ comment: value }),
});

/** Tool → component for comments on orders and lines (ADR 0115). */
export const COMMENT_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  comment_list: commentList,
  comment_get: commentCard,
  comment_create: commentCard,
  comment_update: commentCard,
  comment_archive: commentCard,
};
