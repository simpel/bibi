"use client";

import { Card } from "@bibi/ui";
import { DepositEntry } from "@/features/payment/ui/deposit-entry";
import { useNumberFormat } from "@/lib/number/use-number-format";
import type { GenerativeProps } from "./generative-props";

export type DepositCardViewProps = GenerativeProps<"deposit-card">;

/** One deposit request: what it is for, what is paid of it, status and progress. */
export function DepositCardView({ deposit }: DepositCardViewProps) {
  const numbers = useNumberFormat();
  return (
    <Card data-slot="deposit-card" className="px-4 shadow-none">
      <DepositEntry numbers={numbers} deposit={deposit} />
    </Card>
  );
}
