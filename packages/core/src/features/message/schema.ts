import { z } from "zod";

export const MessageRoleSchema = z.enum(["USER", "ASSISTANT", "TOOL", "SYSTEM"]);

/**
 * One AI SDK `UIMessage` part, stored as-is: `{ type: "text", text }`, `{ type: "reasoning", text }`,
 * `{ type: "tool-<name>", toolCallId, state, input?, output?, errorText? }`, `{ type: "dynamic-tool",
 * … }`, `{ type: "source-url", … }`, `{ type: "file", mediaType, url }`, `{ type: "step-start" }`,
 * `{ type: "data-<name>", data }`. Only `type` (and `text` when present) is checked.
 */
export const MessagePartSchema = z.looseObject({
  type: z.string().min(1).max(100).describe("Part type, e.g. text, reasoning, tool-venue_create"),
  text: z.string().optional(),
});

const MAX_PARTS_JSON = 256_000;
const MAX_METADATA_JSON = 16_000;

type SizeInput = { value: unknown; max: number };
const fits = ({ value, max }: SizeInput): boolean => JSON.stringify(value).length <= max;

export const MessageSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  conversationId: z.string(),
  sequence: z.number().int().describe("0-based position in the conversation"),
  role: MessageRoleSchema,
  parts: z.array(MessagePartSchema),
  metadata: z.record(z.string(), z.unknown()),
  actorType: z.enum(["USER", "AI", "API_KEY", "SYSTEM"]).describe("Who appended the message"),
  createdAt: z.date(),
  createdBy: z.string().nullable(),
});

export const MessageAppendInputSchema = z.object({
  conversationId: z.string().min(1),
  role: MessageRoleSchema,
  parts: z
    .array(MessagePartSchema)
    .min(1)
    .max(200)
    .refine((value) => fits({ value, max: MAX_PARTS_JSON }), "Message parts are too large")
    .describe("AI SDK UIMessage parts, e.g. [{ type: 'text', text: 'Hej' }]"),
  metadata: z
    .record(z.string(), z.unknown())
    .default({})
    .refine((value) => fits({ value, max: MAX_METADATA_JSON }), "Metadata is too large")
    .describe("Free-form JSON, e.g. { model, clientMessageId, usage }"),
});

export const MessageListInputSchema = z.object({
  conversationId: z.string().min(1),
  limit: z.number().int().min(1).max(200).default(100),
  cursor: z.string().optional().describe("id of the last item from the previous page"),
});

export const MessageListOutputSchema = z.object({
  items: z.array(MessageSchema),
  nextCursor: z.string().nullable(),
});

export type MessageDto = z.infer<typeof MessageSchema>;
export type MessagePart = z.infer<typeof MessagePartSchema>;
