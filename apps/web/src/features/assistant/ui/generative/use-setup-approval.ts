"use client";

import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { setOnboardingStatus } from "@/features/user-preference/settings-actions";
import { ROUTES } from "@/lib/routes";
import { useApprovalContext } from "../../state/approval-context";
import { useAssistant } from "../../state/assistant-context";
import { useApprovalDecision } from "./approval/use-approval-decision";
import { useCountdown } from "./approval/use-countdown";
import type { ApprovalCardViewProps } from "./approval-card-view";

/**
 * Decision state of the first-setup card: approve completes the onboarding and opens the board,
 * change reopens the chat.
 */
export function useSetupApproval({ approval, toolCallId }: ApprovalCardViewProps) {
  const t = useTranslations("assistant.approval.setup");
  const router = useRouter();
  const { chat } = useAssistant().session;
  const { conversationId, decisions } = useApprovalContext();
  // Mark the first setup done before leaving, or the app would send the user straight back.
  const finish = async () => {
    await setOnboardingStatus({ onboardingStatus: "COMPLETED" });
    router.push(ROUTES.pipeline);
  };
  const stored = decisions.find((decision) => decision.toolCallId === toolCallId);
  const { state, decide } = useApprovalDecision({
    approval,
    toolCallId,
    conversationId,
    stored,
    onApproved: () => void finish(),
  });
  const seconds = useCountdown({
    expiresAt: approval.expiresAt,
    active: state.phase !== "approved",
  });
  const confirmation =
    state.phase === "approved" ? "accepted" : state.phase === "rejected" ? "rejected" : "requested";
  const locked = state.phase === "pending" || (state.phase === "error" && state.final);
  return {
    state,
    confirmation,
    disabled: locked || seconds === 0,
    approve: () => void decide({ decision: "approve" }),
    change: () => {
      void decide({ decision: "reject" });
      void chat.sendMessage({ text: t("changeMessage") });
    },
  } as const;
}
