import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";

/** A staff comment on an order or one of its lines (ADR 0115). */
export const CommentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  orderId: z.string(),
  lineId: z.string().nullable().describe("The line it is about; null = the whole order"),
  body: z.string().describe("The text; line breaks are kept"),
  editedAt: z.date().nullable().describe("When the author last changed it; null = never"),
  authorName: z
    .string()
    .nullable()
    .describe("The author's name; null when they are no longer a member (or an API key wrote it)"),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable().describe("User id (or API key id) of the author"),
});

const BodySchema = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .describe("The comment, 1–2000 characters. Staff text only; it shows on run sheets.");

export const CommentCreateInputSchema = z.object({
  orderId: z.string().min(1).describe("Id of the order (order.list)"),
  lineId: z
    .string()
    .min(1)
    .nullish()
    .describe("Id of one of the order's lines (line.list) to comment on; omit for the whole order"),
  body: BodySchema,
});

export const CommentUpdateInputSchema = z.object({
  id: z.string().min(1),
  body: BodySchema,
});

export const CommentIdInputSchema = z.object({ id: z.string().min(1) });

export const CommentListInputSchema = z.object({
  orderId: z.string().min(1).describe("Id of the order whose comments to list"),
  lineId: z
    .string()
    .min(1)
    .nullish()
    .describe("A line id: only that line's comments; null: only the whole order's; omit: all"),
  ...PageInputShape,
});

export const CommentListOutputSchema = z.object({
  items: z.array(CommentSchema),
  nextCursor: z.string().nullable(),
});

export type CommentDto = z.infer<typeof CommentSchema>;
export type CommentCreateInput = z.infer<typeof CommentCreateInputSchema>;
export type CommentUpdateInput = z.infer<typeof CommentUpdateInputSchema>;
export type CommentListInput = z.infer<typeof CommentListInputSchema>;
