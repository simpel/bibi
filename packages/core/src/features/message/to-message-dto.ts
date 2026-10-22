import type { Message } from "@bibi/db";
import type { MessageDto, MessagePart } from "./schema";

export type ToMessageDtoInput = { message: Message };

/** Types the JSON columns; `execute` validates the output against `MessageSchema` anyway. */
export function toMessageDto({ message }: ToMessageDtoInput): MessageDto {
  return {
    ...message,
    parts: message.parts as MessagePart[],
    metadata: message.metadata as Record<string, unknown>,
  };
}
