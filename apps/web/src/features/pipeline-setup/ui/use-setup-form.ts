import { zodResolver } from "@hookform/resolvers/zod";
import type { PipelineSetupDraft } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { ROUTES } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { activatePipelineSetupAction } from "../actions";
import { pipelineSetupFormSchema, type SetupFormValues } from "./setup-form-schema";

export type UseSetupFormInput = { defaults: SetupFormValues };

/** The wizard's form, wired to core's draft schema; saving activates and opens the settings. */
export function useSetupForm({ defaults }: UseSetupFormInput) {
  const t = useTranslations("pipelineSetup");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<SetupFormValues, unknown, PipelineSetupDraft>({
    resolver: zodResolver(pipelineSetupFormSchema, useZodMessages()),
    defaultValues: defaults,
  });
  const { run, pending } = useFormAction({
    form,
    action: ({ values }) => activatePipelineSetupAction({ input: values }),
    messages: { pending: common("saving"), success: t("activated") },
    onSuccess: () => {
      router.push(ROUTES.settingsPipeline);
      router.refresh();
    },
  });
  return { form, run, pending };
}
