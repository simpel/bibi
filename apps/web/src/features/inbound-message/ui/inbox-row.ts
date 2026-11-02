import type { InboundMessageDto } from "@bibi/core/schemas";

/** One inbox table row, prepared on the server (dates formatted there, ADR 0064). */
export type InboxRow = Pick<InboundMessageDto, "id" | "channel" | "subject"> & {
  sender: string | null;
  /** ISO instant, for sorting. */
  receivedAt: string;
  receivedLabel: string;
  dismissed: boolean;
};
