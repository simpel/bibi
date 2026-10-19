"use client";

import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ApprovalErrorLine } from "./approval/approval-error-line";
import type { ApprovalCardViewProps } from "./approval-card-view";
import { useSetupApproval } from "./use-setup-approval";

/**
 * The first-setup approval (ADR 0045): the `Confirmation` card is the Save button. Approving
 * sets the organization up and opens the board; "Change something" goes back to the chat.
 */
export function SetupApprovalCardView(props: ApprovalCardViewProps) {
  const t = useTranslations("assistant.approval.setup");
  const { state, confirmation, disabled, approve, change } = useSetupApproval(props);
  return (
    <Confirmation state={confirmation} data-slot="setup-approval-card">
      <ConfirmationTitle>{t("title")}</ConfirmationTitle>
      <ConfirmationRequest>
        <p className="text-muted-foreground">{t("request")}</p>
        <p className="mt-2 text-muted-foreground">{t("archiveNote")}</p>
      </ConfirmationRequest>
      <ConfirmationAccepted>{t("accepted")}</ConfirmationAccepted>
      <ConfirmationRejected>{t("rejected")}</ConfirmationRejected>
      <ApprovalErrorLine state={state} />
      <ConfirmationActions>
        <ConfirmationAction disabled={disabled} onClick={approve}>
          {state.phase === "pending" ? t("creating") : t("approve")}
        </ConfirmationAction>
        <ConfirmationAction variant="outline" disabled={disabled} onClick={change}>
          {t("change")}
        </ConfirmationAction>
      </ConfirmationActions>
    </Confirmation>
  );
}
