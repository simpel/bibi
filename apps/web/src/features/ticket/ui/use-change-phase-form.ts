import type { TicketDto } from "@bibi/core";
import { useRouter } from "@bibi/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { changeTicketPhaseAction } from "../actions";
import {
  type ChangePhaseFormOutput,
  type ChangePhaseFormValues,
  changePhaseFormSchema,
} from "./change-phase-form-schema";

export type UseChangePhaseFormInput = { ticket: TicketDto; onDone: () => void };

const FIELD_OF = {
  reason: "reason",
  phaseId: "phaseId",
  assigneeId: "phaseId",
  quote: "phaseId",
} as const;
const MESSAGE_OF = {
  reason: "reasonRequired",
  phaseId: "transitionRefused",
  assigneeId: "assigneeRequired",
  quote: "acceptedQuoteRequired",
} as const;

/**
 * Change-phase form state; each blocker of a refused move is shown on its field, blocked lines
 * on the phase.
 */
export function useChangePhaseForm({ ticket, onDone }: UseChangePhaseFormInput) {
  const t = useTranslations("ticket");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<ChangePhaseFormValues, unknown, ChangePhaseFormOutput>({
    resolver: zodResolver(changePhaseFormSchema({ ticketId: ticket.id }), useZodMessages()),
    defaultValues: { phaseId: "", reason: "" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => changeTicketPhaseAction({ input: values }),
    messages: { pending: common("saving"), success: t("phaseChanged") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
    onError: ({ error }) => {
      for (const { path } of error.issues) {
        if (!(path in FIELD_OF)) continue;
        const key = path as keyof typeof FIELD_OF;
        form.setError(FIELD_OF[key], { message: t(MESSAGE_OF[key]) });
      }
      // Lines whose state move is refused (ADR 0044): a hold collides or a transition is not allowed.
      const lines = error.issues.filter(({ path }) => path.startsWith("lines.")).length;
      if (lines > 0) form.setError("phaseId", { message: t("linesBlocked", { count: lines }) });
    },
  });
  return { form, submit, pending };
}
