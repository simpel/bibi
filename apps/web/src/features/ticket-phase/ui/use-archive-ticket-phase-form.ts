import type { TicketPhaseArchiveInput } from "@bibi/core/schemas";
import { TicketPhaseArchiveInputSchema } from "@bibi/core/schemas";
import { useRouter } from "@bibi/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { useArchivePreview } from "@/components/archive-preview/use-archive-preview";
import { NONE } from "@/components/form/option-select-field";
import { formSchema } from "@/lib/form-schema";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { archiveTicketPhaseAction, previewArchiveTicketPhaseAction } from "../actions";

type Values = { targetPhaseId: string; reason: string };

const archiveSchema = ({ id }: { id: string }) =>
  formSchema({
    schema: TicketPhaseArchiveInputSchema,
    toInput: ({ values }: { values: Values }) => ({
      id,
      ...(values.targetPhaseId && values.targetPhaseId !== NONE
        ? { targetPhaseId: values.targetPhaseId }
        : {}),
      ...(values.reason.trim() ? { reason: values.reason } : {}),
    }),
  });

const useArchiveForm = ({ id }: { id: string }) =>
  useForm<Values, unknown, TicketPhaseArchiveInput>({
    resolver: zodResolver(archiveSchema({ id }), useZodMessages()),
    defaultValues: { targetPhaseId: NONE, reason: "" },
  });

export type UseArchiveTicketPhaseFormInput = { id: string; onDone: () => void };

/** The archive form, its submit flow and the dry-run preview of the chosen target. */
export function useArchiveTicketPhaseForm({ id, onDone }: UseArchiveTicketPhaseFormInput) {
  const t = useTranslations("ticketPhase");
  const router = useRouter();
  const form = useArchiveForm({ id });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => archiveTicketPhaseAction({ input: values }),
    messages: { pending: t("archiving"), success: t("archived") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  const [targetPhaseId, reason] = useWatch({
    control: form.control,
    name: ["targetPhaseId", "reason"],
  });
  const preview = useArchivePreview({
    inputKey: `${targetPhaseId}|${reason}`,
    load: () =>
      previewArchiveTicketPhaseAction({
        input: {
          id,
          ...(targetPhaseId && targetPhaseId !== NONE ? { targetPhaseId } : {}),
          ...(reason.trim() ? { reason } : {}),
        },
      }),
  });
  return { form, submit, pending, ...preview };
}
