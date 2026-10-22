import { type AiFeatureSetting, AiFeatureUpdateInputSchema } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { updateAiFeatureAction } from "../actions";
import type { ModelFormValues } from "./model-select-field";

const SCHEMA = AiFeatureUpdateInputSchema.pick({ modelId: true });

export type UseModelSelectInput = { setting: AiFeatureSetting };

/** Form state of one row: save on pick, confirm first when the feature needs a reindex. */
export function useModelSelect({ setting }: UseModelSelectInput) {
  const t = useTranslations("admin.aiModels");
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const form = useForm<ModelFormValues>({
    resolver: zodResolver(SCHEMA, useZodMessages()),
    defaultValues: { modelId: setting.modelId ?? "" },
  });
  const restore = () => form.reset({ modelId: setting.modelId ?? "" });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => updateAiFeatureAction({ feature: setting.id, modelId: values.modelId }),
    messages: { pending: t("saving"), success: t("saved") },
    onSuccess: ({ values }) => {
      form.reset(values);
      router.refresh();
    },
    onError: restore,
  });
  const pick = () => (setting.requiresReindex ? setConfirming(true) : void submit());
  const confirm = () => {
    setConfirming(false);
    void submit();
  };
  const cancel = () => {
    restore();
    setConfirming(false);
  };
  return { form, submit, pending, confirming, pick, confirm, cancel };
}
