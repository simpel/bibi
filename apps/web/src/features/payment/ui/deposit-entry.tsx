import type { DepositDto, NumberFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
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

/**
 * One deposit request: what it is for, what is paid of its amount, status and progress, and its
 * prepayment invoice in the accounting system when it was raised there (ADR 0106).
 */
export function DepositEntry({ deposit, actions, numbers }: DepositEntryProps) {
  const t = useTranslations("invoice");
  const providers = useTranslations("providers");
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
      {deposit.provider && deposit.status === "SENT" ? (
        <span className="text-xs text-muted-foreground">
          {deposit.providerReference
            ? t("inProvider", {
                name: providers(`${deposit.provider}.name`),
                reference: deposit.providerReference,
              })
            : t("notInProvider", { name: providers(`${deposit.provider}.name`) })}
        </span>
      ) : null}
      {actions ? <div className="ml-auto flex gap-2">{actions}</div> : null}
    </article>
  );
}
