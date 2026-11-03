"use client";

import type { SeatRequestDto } from "@bibi/core/schemas";
import { DataTableRowActions } from "@bibi/ui";
import { CheckIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { approveSeatAction, rejectSeatAction } from "../actions";

export type SeatRequestActionsProps = { request: SeatRequestDto; seatPrice: string };

type Decision = "approve" | "decline";

type UseSeatDecisionInput = { request: SeatRequestDto };

/** The open confirmation and the action it runs once confirmed. */
function useSeatDecision({ request }: UseSeatDecisionInput) {
  const t = useTranslations("billing.requests");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const [decision, setDecision] = useState<Decision | null>(null);
  const approve = decision === "approve";
  const decide = () =>
    run({
      action: () => (approve ? approveSeatAction : rejectSeatAction)({ id: request.id }),
      messages: approve
        ? { pending: t("approving"), success: t("approved") }
        : { pending: t("declining"), success: t("declined") },
      onSuccess: () => {
        setDecision(null);
        router.refresh();
      },
    });
  return { decision, setDecision, approve, decide, pending };
}

/** Approve (adds a paid seat, sends the invitation) or decline (cancels it), each confirmed. */
export function SeatRequestActions({ request, seatPrice }: SeatRequestActionsProps) {
  const t = useTranslations("billing.requests");
  const common = useTranslations("common");
  const { decision, setDecision, approve, decide, pending } = useSeatDecision({ request });
  const { email } = request;
  return (
    <>
      <DataTableRowActions
        label={common("actions")}
        primary={[
          { label: t("approve"), icon: CheckIcon, onClick: () => setDecision("approve") },
          {
            destructive: true,
            label: t("decline"),
            icon: XIcon,
            onClick: () => setDecision("decline"),
          },
        ]}
      />
      <ConfirmDialog
        open={decision !== null}
        onOpenChange={(open) => (open ? null : setDecision(null))}
        title={approve ? t("approveTitle", { email }) : t("declineTitle", { email })}
        description={
          approve ? t("approveDescription", { price: seatPrice }) : t("declineDescription")
        }
        confirmLabel={approve ? t("approve") : t("decline")}
        pending={pending}
        onConfirm={decide}
      />
    </>
  );
}
