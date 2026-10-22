"use client";

import type { ReceivableStatus } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RequestPaymentButton } from "./request-payment-button";
import { type ReceivableKind, useReceivableMove } from "./use-receivable-move";

export type ReceivableActionsProps = {
  kind: ReceivableKind;
  id: string;
  status: ReceivableStatus;
  openMinor: number;
  /** The localized "void …?" question for this receivable. */
  voidConfirm: string;
};

/** Request payment (SENT with money open), mark as sent (DRAFT) and void (not yet VOID). */
export function ReceivableActions({
  kind,
  id,
  status,
  openMinor,
  voidConfirm,
}: ReceivableActionsProps) {
  const t = useTranslations(kind);
  const [confirming, setConfirming] = useState(false);
  const { move, pending } = useReceivableMove({ kind, id, onDone: () => setConfirming(false) });
  const target = kind === "deposit" ? { depositId: id } : { invoiceId: id };
  return (
    <>
      {status === "SENT" && openMinor > 0 ? (
        <RequestPaymentButton target={target} openMinor={openMinor} />
      ) : null}
      {status === "DRAFT" ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => move({ to: "send" })}>
          {t("send")}
        </Button>
      ) : null}
      {status === "VOID" ? null : (
        <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
          {t("void")}
        </Button>
      )}
      <ConfirmDialog
        {...{ open: confirming, onOpenChange: setConfirming, pending }}
        title={t("void")}
        description={voidConfirm}
        confirmLabel={t("void")}
        onConfirm={() => move({ to: "void" })}
      />
    </>
  );
}
