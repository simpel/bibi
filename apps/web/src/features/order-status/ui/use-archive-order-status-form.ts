import type { OrderStatusArchiveInput } from "@bibi/core/schemas";
import { OrderStatusArchiveInputSchema } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { useArchivePreview } from "@/components/archive-preview/use-archive-preview";
import { NONE } from "@/components/form/option-select-field";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { archiveOrderStatusAction, previewArchiveOrderStatusAction } from "../actions";

type Values = { targetStatusId: string; reason: string };

const archiveSchema = ({ id }: { id: string }) =>
  formSchema({
    schema: OrderStatusArchiveInputSchema,
    toInput: ({ values }: { values: Values }) => ({
      id,
      ...(values.targetStatusId && values.targetStatusId !== NONE
        ? { targetStatusId: values.targetStatusId }
        : {}),
      ...(values.reason.trim() ? { reason: values.reason } : {}),
    }),
  });

const useArchiveForm = ({ id }: { id: string }) =>
  useForm<Values, unknown, OrderStatusArchiveInput>({
    resolver: zodResolver(archiveSchema({ id }), useZodMessages()),
    defaultValues: { targetStatusId: NONE, reason: "" },
  });

export type UseArchiveOrderStatusFormInput = { id: string; onDone: () => void };

/** The archive form, its submit flow and the dry-run preview of the chosen target. */
export function useArchiveOrderStatusForm({ id, onDone }: UseArchiveOrderStatusFormInput) {
  const t = useTranslations("orderStatus");
  const router = useRouter();
  const form = useArchiveForm({ id });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => archiveOrderStatusAction({ input: values }),
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
      previewArchiveOrderStatusAction({
        input: {
          id,
          ...(targetStatusId && targetStatusId !== NONE ? { targetStatusId } : {}),
          ...(reason.trim() ? { reason } : {}),
        },
      }),
  });
  return { form, submit, pending, ...preview };
}
