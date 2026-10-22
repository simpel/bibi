import { ItemStateArchiveInputSchema } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { useArchivePreview } from "@/components/archive-preview/use-archive-preview";
import { NONE } from "@/components/form/option-select-field";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { archiveItemStateAction, previewArchiveItemStateAction } from "../actions";

type Values = { targetStateId: string };
type Output = z.infer<typeof ItemStateArchiveInputSchema>;

const schemaFor = ({ id }: { id: string }) =>
  formSchema({
    schema: ItemStateArchiveInputSchema,
    toInput: ({ values }: { values: Values }) => ({
      id,
      ...(values.targetStateId && values.targetStateId !== NONE
        ? { targetStateId: values.targetStateId }
        : {}),
    }),
  });

export type UseArchiveItemStateFormInput = { id: string; onDone: () => void };

/** The archive form, its submit flow and the dry-run preview of the chosen target. */
export function useArchiveItemStateForm({ id, onDone }: UseArchiveItemStateFormInput) {
  const t = useTranslations("itemState");
  const router = useRouter();
  const form = useForm<Values, unknown, Output>({
    resolver: zodResolver(schemaFor({ id }), useZodMessages()),
    defaultValues: { targetStateId: NONE },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => archiveItemStateAction({ input: values }),
    messages: { pending: t("archiving"), success: t("archived") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  const targetStateId = useWatch({ control: form.control, name: "targetStateId" });
  const preview = useArchivePreview({
    inputKey: targetStateId,
    load: () =>
      previewArchiveItemStateAction({
        input: { id, ...(targetStateId && targetStateId !== NONE ? { targetStateId } : {}) },
      }),
  });
  return { form, submit, pending, ...preview };
}
