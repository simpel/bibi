"use client";

import { Card } from "@okazi/ui";
import { InboundEmailList } from "@/features/inbound-email/ui/inbound-email-list";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type InboundEmailTableViewProps = GenerativeProps<"inbound-email-table">;

/** A page of mails received on a booking's inbound address, newest first. */
export function InboundEmailTableView({ items, nextCursor }: InboundEmailTableViewProps) {
  return (
    <Card data-slot="inbound-email-table" className="px-4 shadow-none">
      <InboundEmailList emails={items} />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
