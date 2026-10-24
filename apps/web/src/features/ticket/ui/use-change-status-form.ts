import type { TicketDto } from "@bibi/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { changeTicketStatusAction } from "../actions";
import {
  type ChangeStatusFormOutput,
  type ChangeStatusFormValues,
  changeStatusFormSchema,
} from "./change-status-form-schema";

export type UseChangeStatusFormInput = { ticket: TicketDto; onDone: () => void };

const FIELD_OF = {
  reason: "reason",
  statusId: "statusId",
  assigneeId: "statusId",
  quote: "statusId",
} as const;
const MESSAGE_OF = {
  reason: "reasonRequired",
  statusId: "transitionRefused",
  assigneeId: "assigneeRequired",
  quote: "acceptedQuoteRequired",
} as const;

/**
 * Change-status form state; each blocker of a refused move is shown on its field, blocked lines
 * on the status.
 */
export function useChangeStatusForm({ ticket, onDone }: UseChangeStatusFormInput) {
  const t = useTranslations("ticket");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<ChangeStatusFormValues, unknown, ChangeStatusFormOutput>({
    resolver: zodResolver(changeStatusFormSchema({ ticketId: ticket.id }), useZodMessages()),
    defaultValues: { statusId: "", reason: "" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => changeTicketStatusAction({ input: values }),
    messages: { pending: common("saving"), success: t("statusChanged") },
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
      if (lines > 0) form.setError("statusId", { message: t("linesBlocked", { count: lines }) });
    },
  });
  return { form, submit, pending };
}
