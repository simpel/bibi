"use client";

import { Card } from "@bibi/ui";
import { InboundEmailList } from "@/features/inbound-email/ui/inbound-email-list";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type InboundEmailTableViewProps = GenerativeProps<"inbound-email-table">;

/** A page of mails received on a ticket's inbound address, newest first. */
export function InboundEmailTableView({ items, nextCursor }: InboundEmailTableViewProps) {
  const dates = useDateTimeFormat();
  return (
    <Card data-slot="inbound-email-table" className="px-4 shadow-none">
      <InboundEmailList dates={dates} emails={items} />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
