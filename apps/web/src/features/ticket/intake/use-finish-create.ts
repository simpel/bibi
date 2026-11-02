import type { TicketDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { actionWithToast } from "@/lib/action-with-toast";
import { useRouter } from "@/lib/navigation";
import { ticketRoute } from "@/lib/routes";
import { createTicketTemplateAction } from "../../ticket-template/actions";
import { toTemplateInput } from "./create-input";
import { clearDraft } from "./draft-storage";
import type { ReviewFormValues } from "./review-form-values";
import type { ReviewModel } from "./use-review-model";

type SaveInput = { model: ReviewModel; values: ReviewFormValues };

/** The template input for "Also save these lines as a package", or null when it cannot be. */
function templateOf({ model, values }: SaveInput) {
  const { preview, period, review } = model;
  if (!values.saveAsPackage || !period || preview.status !== "ready") return null;
  const name = values.packageName;
  const ticketTypeId = values.entityTypeId;
  return toTemplateInput({ name, ticketTypeId, statusId: preview.statusId, review, period });
}

export type FinishInput = { ticket: TicketDto; values: ReviewFormValues };

/**
 * After Create (ADR 0081): the package is saved when asked (a failure is a toast; the ticket
 * stays), the local draft is cleared and the ticket page opens.
 */
export function useFinishCreate({ model }: { model: () => ReviewModel | null }) {
  const t = useTranslations("ticketIntake.create");
  const errors = useTranslations("errors");
  const router = useRouter();
  return ({ ticket, values }: FinishInput) => {
    const current = model();
    if (!current) return;
    const input = templateOf({ model: current, values });
    const translate = ({ key }: { key: Parameters<typeof errors>[0] }) => errors(key);
    const saved = input
      ? actionWithToast({
          action: () => createTicketTemplateAction({ input }),
          messages: { pending: t("savingPackage"), success: t("packageSaved") },
          translate,
        })
      : Promise.resolve(null);
    void saved.finally(() => {
      clearDraft({ key: current.data.draftKey });
      router.push(ticketRoute({ id: ticket.id }));
    });
  };
}
