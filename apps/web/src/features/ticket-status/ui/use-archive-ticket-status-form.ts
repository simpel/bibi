import type { TicketStatusArchiveInput } from "@bibi/core/schemas";
import { TicketStatusArchiveInputSchema } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { useArchivePreview } from "@/components/archive-preview/use-archive-preview";
import { NONE } from "@/components/form/option-select-field";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { archiveTicketStatusAction, previewArchiveTicketStatusAction } from "../actions";

type Values = { targetStatusId: string; reason: string };

const archiveSchema = ({ id }: { id: string }) =>
  formSchema({
    schema: TicketStatusArchiveInputSchema,
    toInput: ({ values }: { values: Values }) => ({
      id,
      ...(values.targetStatusId && values.targetStatusId !== NONE
        ? { targetStatusId: values.targetStatusId }
        : {}),
      ...(values.reason.trim() ? { reason: values.reason } : {}),
    }),
  });

const useArchiveForm = ({ id }: { id: string }) =>
  useForm<Values, unknown, TicketStatusArchiveInput>({
    resolver: zodResolver(archiveSchema({ id }), useZodMessages()),
    defaultValues: { targetStatusId: NONE, reason: "" },
  });

export type UseArchiveTicketStatusFormInput = { id: string; onDone: () => void };

/** The archive form, its submit flow and the dry-run preview of the chosen target. */
export function useArchiveTicketStatusForm({ id, onDone }: UseArchiveTicketStatusFormInput) {
  const t = useTranslations("ticketStatus");
  const router = useRouter();
  const form = useArchiveForm({ id });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => archiveTicketStatusAction({ input: values }),
    messages: { pending: t("archiving"), success: t("archived") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  const [targetStatusId, reason] = useWatch({
    control: form.control,
    name: ["targetStatusId", "reason"],
  });
  const preview = useArchivePreview({
    inputKey: `${targetStatusId}|${reason}`,
    load: () =>
      previewArchiveTicketStatusAction({
        input: {
          id,
          ...(targetStatusId && targetStatusId !== NONE ? { targetStatusId } : {}),
          ...(reason.trim() ? { reason } : {}),
        },
      }),
  });
  return { form, submit, pending, ...preview };
}
