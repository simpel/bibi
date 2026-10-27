"use client";

import { Card } from "@bibi/ui";
import { DepositEntry } from "@/features/payment/ui/deposit-entry";
import { useNumberFormat } from "@/lib/number/use-number-format";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type DepositTableViewProps = GenerativeProps<"deposit-table">;

/** A page of a ticket's deposit requests, newest first. */
export function DepositTableView({ items, nextCursor }: DepositTableViewProps) {
  const numbers = useNumberFormat();
  return (
    <Card data-slot="deposit-table" className="px-4 shadow-none">
      <ol className="divide-y">
        {items.map((deposit) => (
          <li key={deposit.id}>
            <DepositEntry numbers={numbers} deposit={deposit} />
          </li>
        ))}
      </ol>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
