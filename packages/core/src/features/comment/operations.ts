import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import {
  CommentIdInputSchema,
  CommentListInputSchema,
  CommentListOutputSchema,
  CommentSchema,
} from "./schema";
import { COMMENT_INCLUDE, loadComment, toCommentDtos } from "./to-comment-dto";
import { archiveComment, createComment, updateComment } from "./write-operations";

export const listComments = defineOperation({
  name: "comment.list",
  kind: "query",
  description:
    "List staff comments on an order, oldest first, with each author's name and who they " +
    "mention. Replies carry `parentCommentId`. `lineId` gives one line's comments, " +
    "`lineId: null` only those on the whole order; omit it for all.",
  input: CommentListInputSchema,
  output: CommentListOutputSchema,
  permission: "comment:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.comment.findMany({
      where: {
        orderId: input.orderId,
        ...(input.lineId === undefined ? {} : { lineId: input.lineId }),
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: COMMENT_INCLUDE,
      ...pageArgs(input),
    });
    const page = paginate({ rows, limit: input.limit });
    const items = await toCommentDtos({ context, rows: page.items });
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getComment = defineOperation({
  name: "comment.get",
  kind: "query",
  description: "Get one comment by id, with its author's name.",
  input: CommentIdInputSchema,
  output: CommentSchema,
  permission: "comment:read",
  handler: async ({ input, context }) => {
    const comment = await loadComment({ context, id: input.id });
    return comment ? ok({ value: comment }) : notFound({ entity: "Comment" });
  },
});

export const commentOperations = [
  listComments,
  getComment,
  createComment,
  updateComment,
  archiveComment,
];
