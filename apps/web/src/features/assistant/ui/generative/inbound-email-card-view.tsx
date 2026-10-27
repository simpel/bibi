"use client";

import { Card } from "@bibi/ui";
import { InboundEmailEntry } from "@/features/inbound-email/ui/inbound-email-entry";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type InboundEmailCardViewProps = GenerativeProps<"inbound-email-card">;

/** One received mail: sender, subject, text body and attachment names. */
export function InboundEmailCardView({ email }: InboundEmailCardViewProps) {
  const dates = useDateTimeFormat();
  return (
    <Card data-slot="inbound-email-card" className="px-4 shadow-none">
      <InboundEmailEntry dates={dates} email={email} />
    </Card>
  );
}
