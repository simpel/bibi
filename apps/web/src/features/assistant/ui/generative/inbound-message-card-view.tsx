"use client";

import { Card } from "@bibi/ui";
import { MessageEntry } from "@/features/inbound-message/ui/message-entry";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type InboundMessageCardViewProps = GenerativeProps<"inbound-message-card">;

/** One inbound message: sender, channel, subject, text and form fields. */
export function InboundMessageCardView({ message }: InboundMessageCardViewProps) {
  const dates = useDateTimeFormat();
  return (
    <Card data-slot="inbound-message-card" className="px-4 shadow-none">
      <MessageEntry dates={dates} message={message} />
    </Card>
  );
}
