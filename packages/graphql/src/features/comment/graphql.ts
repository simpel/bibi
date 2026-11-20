import {
  archiveComment,
  type CommentDto,
  CommentSchema,
  createComment,
  getComment,
  listComments,
  updateComment,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import type { GraphqlContext } from "../../schema/context";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { LineRef } from "../line/graphql";
import { OrderRef } from "../order/graphql";

export const CommentRef = objectFromSchema<CommentDto>({
  name: "Comment",
  schema: CommentSchema,
  omit: ["organizationId"],
  description:
    "Comment – staff's text on an order, or on one of its lines (lineId). Shown on the " +
    "order's run sheets (ADR 0115).",
});
const CommentPageRef = pageType({ name: "CommentPage", item: CommentRef });

fieldFromOperation({ operation: listComments, type: CommentPageRef, name: "comments" });
fieldFromOperation({ operation: getComment, type: CommentRef, name: "comment" });
mutationFromOperation({ operation: createComment, type: CommentRef });
mutationFromOperation({ operation: updateComment, type: CommentRef });
mutationFromOperation({ operation: archiveComment, type: CommentRef });

type ListByInput = { orderId: string; lineId?: string | null; limit: number | null | undefined };

/** Graph edges from the order and the line; they read through `comment.list`. */
async function listBy({ limit, ctx, ...where }: ListByInput & { ctx: GraphqlContext }) {
  const input = { ...where, limit: Math.min(Math.max(limit ?? 50, 1), 100) };
  const page = (await runOperation({ operation: listComments, input, ctx })) as {
    items: CommentDto[];
  };
  return page.items;
}

// Graph edges. They live here so that order/ and line/graphql.ts need not import this.
builder.objectField(OrderRef, "comments", (t) =>
  t.field({
    type: [CommentRef],
    description: "Comments on the whole order (not its lines), oldest first.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: (order, { limit }, ctx) => listBy({ orderId: order.id, lineId: null, limit, ctx }),
  }),
);

builder.objectField(LineRef, "comments", (t) =>
  t.field({
    type: [CommentRef],
    description: "Comments on the line, oldest first.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: (line, { limit }, ctx) =>
      listBy({ orderId: line.orderId, lineId: line.id, limit, ctx }),
  }),
);
