import type { DepositDto, NumberFormat } from "@bibi/core/schemas";
import type { ReactNode } from "react";
import { PaidOf } from "./paid-of";
import { ReceivableBadges } from "./receivable-badges";

/** A deposit request as the server (Date) or a tool result (ISO string) carries it. */
export type DepositValue = Omit<
  DepositDto,
  "createdAt" | "updatedAt" | "dueDate" | "statusChangedAt"
> & { dueDate: Date | string | null };

export type DepositEntryProps = {
  deposit: DepositValue;
  actions?: ReactNode;
  /** The viewer's number format, from the server or a client card's hook. */
  numbers: NumberFormat;
};

/** One deposit request: what it is for, what is paid of its amount, status and progress. */
export function DepositEntry({ deposit, actions, numbers }: DepositEntryProps) {
  return (
    <article data-slot="deposit-entry" className="flex flex-wrap items-center gap-2 py-3 text-sm">
      <span className="font-medium">{deposit.description}</span>
      <PaidOf
        numbers={numbers}
        paidMinor={deposit.paidMinor}
        amountMinor={deposit.amountMinor}
        currency={deposit.currency}
      />
      <ReceivableBadges status={deposit.status} progress={deposit.progress} />
      {actions ? <div className="ml-auto flex gap-2">{actions}</div> : null}
    </article>
  );
}
