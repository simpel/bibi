import type { InboundMessageDto } from "@bibi/core/schemas";

/** An inbound message as the server (Date) or a tool result (ISO string) carries it. */
export type InboundMessageValue = Omit<InboundMessageDto, "receivedAt" | "createdAt" | "readAt"> & {
  receivedAt: Date | string;
  readAt: Date | string | null;
};

export type SenderOfInput = {
  message: Pick<InboundMessageValue, "fromName" | "fromEmail" | "fromPhone">;
};

/** `Name <email>`, or whichever of name, email and phone the channel gave; null for none. */
export function senderOf({ message }: SenderOfInput): string | null {
  const contact = message.fromEmail ?? message.fromPhone;
  if (message.fromName && contact) return `${message.fromName} <${contact}>`;
  return message.fromName ?? contact ?? null;
}
