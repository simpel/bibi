"use client";

import type { SeatRequestDto } from "@bibi/core/schemas";
import { ContextMenuItem, DataTableRowActions } from "@bibi/ui";
import { CheckIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { approveSeatAction, rejectSeatAction } from "../actions";

export type SeatDecision = { request: SeatRequestDto; kind: "approve" | "decline" };

export type SeatRequestActionsProps = {
  request: SeatRequestDto;
  /** Opens the confirmation; the dialog lives in the table so a context menu can open it too. */
  onDecide: (decision: SeatDecision) => void;
};

/** Approve and decline buttons of one held invitation. */
export function SeatRequestActions({ request, onDecide }: SeatRequestActionsProps) {
  const t = useTranslations("billing.requests");
  const common = useTranslations("common");
  return (
    <DataTableRowActions
      label={common("actions")}
      primary={[
        {
          label: t("approve"),
          icon: CheckIcon,
          onClick: () => onDecide({ request, kind: "approve" }),
        },
        {
          destructive: true,
          label: t("decline"),
          icon: XIcon,
          onClick: () => onDecide({ request, kind: "decline" }),
        },
      ]}
    />
  );
}

/** Right-click menu of one held invitation: the same two decisions. */
export function SeatRequestRowMenu({ request, onDecide }: SeatRequestActionsProps) {
  const t = useTranslations("billing.requests");
  return (
    <>
      <ContextMenuItem onSelect={() => onDecide({ request, kind: "approve" })}>
        <CheckIcon />
        {t("approve")}
      </ContextMenuItem>
      <ContextMenuItem destructive onSelect={() => onDecide({ request, kind: "decline" })}>
        <XIcon />
        {t("decline")}
      </ContextMenuItem>
    </>
  );
}

export type SeatDecisionDialogProps = {
  decision: SeatDecision;
  seatPrice: string;
  onClose: () => void;
};

/** Approve (adds a paid seat, sends the invitation) or decline (cancels it), confirmed here. */
export function SeatDecisionDialog({ decision, seatPrice, onClose }: SeatDecisionDialogProps) {
  const t = useTranslations("billing.requests");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const { request, kind } = decision;
  const approve = kind === "approve";
  const { email } = request;
  const decide = () =>
    run({
      action: () => (approve ? approveSeatAction : rejectSeatAction)({ id: request.id }),
      messages: approve
        ? { pending: t("approving"), success: t("approved") }
        : { pending: t("declining"), success: t("declined") },
      onSuccess: () => {
        onClose();
        router.refresh();
      },
    });
  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => (open ? null : onClose())}
      title={approve ? t("approveTitle", { email }) : t("declineTitle", { email })}
      description={
        approve ? t("approveDescription", { price: seatPrice }) : t("declineDescription")
      }
      confirmLabel={approve ? t("approve") : t("decline")}
      pending={pending}
      onConfirm={decide}
    />
  );
}
