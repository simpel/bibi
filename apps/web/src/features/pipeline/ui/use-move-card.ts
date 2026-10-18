import type { PipelineCard, PipelineColumn } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { changeBookingStatusAction } from "@/features/booking/actions";
import { qualifyInquiryAction } from "@/features/inquiry/actions";
import type { ActionResult } from "@/lib/action-result";
import { useToastAction } from "@/lib/use-toast-action";

export type MoveCardInput = { card: PipelineCard; to: PipelineColumn; toTitle: string };

/** Runs the command behind a drop (booking status change or qualify) in the one-toast flow. */
export function useMoveCard() {
  const t = useTranslations("pipeline");
  const common = useTranslations("common");
  const router = useRouter();
  const { run } = useToastAction();
  return ({ card, to, toTitle }: MoveCardInput) => {
    const action = (): Promise<ActionResult<unknown>> =>
      card.kind === "INQUIRY"
        ? qualifyInquiryAction({ input: { id: card.id } })
        : changeBookingStatusAction({
            input: { bookingId: card.id, statusId: to.bookingStatusId ?? "" },
          });
    run({
      action,
      messages: { pending: common("saving"), success: () => t("moved", { column: toTitle }) },
      onSuccess: () => router.refresh(),
    });
  };
}
