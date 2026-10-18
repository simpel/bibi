import type { PipelineCard, PipelineColumn } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { changeTicketPhaseAction } from "@/features/ticket/actions";
import { useToastAction } from "@/lib/use-toast-action";

export type MoveCardInput = { card: PipelineCard; to: PipelineColumn; toTitle: string };

/** Runs `ticket.changePhase` behind a drop in the one-toast flow. */
export function useMoveCard() {
  const t = useTranslations("pipeline");
  const common = useTranslations("common");
  const router = useRouter();
  const { run } = useToastAction();
  return ({ card, to, toTitle }: MoveCardInput) => {
    run({
      action: () => changeTicketPhaseAction({ input: { ticketId: card.id, phaseId: to.id } }),
      messages: { pending: common("saving"), success: () => t("moved", { column: toTitle }) },
      onSuccess: () => router.refresh(),
    });
  };
}
