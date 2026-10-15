"use client";

import { Card } from "@okazi/ui";
import { InboundEmailEntry } from "@/features/inbound-email/ui/inbound-email-entry";
import type { GenerativeProps } from "./generative-props";

export type InboundEmailCardViewProps = GenerativeProps<"inbound-email-card">;

/** One received mail: sender, subject, text body and attachment names. */
export function InboundEmailCardView({ email }: InboundEmailCardViewProps) {
  return (
    <Card data-slot="inbound-email-card" className="px-4 shadow-none">
      <InboundEmailEntry email={email} />
    </Card>
  );
}
