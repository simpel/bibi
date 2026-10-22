import type { ApiKeyCreated, ApiKeyCreateInput } from "@bibi/core";
import { useRouter } from "@bibi/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createApiKeyAction } from "../actions";
import { type ApiKeyFormValues, apiKeyFormDefaults, apiKeyFormSchema } from "./api-key-form-schema";

export type UseApiKeyFormInput = { onCreated: (input: { created: ApiKeyCreated }) => void };

/** Create form: one toast per save; a role above the caller's access fails on the role field. */
export function useApiKeyForm({ onCreated }: UseApiKeyFormInput) {
  const t = useTranslations("integration.apiKeys");
  const router = useRouter();
  const form = useForm<ApiKeyFormValues, unknown, ApiKeyCreateInput>({
    resolver: zodResolver(apiKeyFormSchema, useZodMessages()),
    defaultValues: apiKeyFormDefaults,
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createApiKeyAction({ input: values }),
    messages: { pending: t("creating"), success: t("created") },
    onSuccess: ({ value }) => {
      router.refresh();
      onCreated({ created: value });
    },
  });
  return { form, submit, pending };
}
