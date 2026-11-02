"use client";

import { Card } from "@bibi/ui";
import { MessageList } from "@/features/inbound-message/ui/message-list";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type InboundMessageTableViewProps = GenerativeProps<"inbound-message-table">;

/** A page of inbound messages of any channel, newest first (ADR 0085). */
export function InboundMessageTableView({ items, nextCursor }: InboundMessageTableViewProps) {
  const dates = useDateTimeFormat();
  return (
    <Card data-slot="inbound-message-table" className="px-4 shadow-none">
      <MessageList dates={dates} messages={items} />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
