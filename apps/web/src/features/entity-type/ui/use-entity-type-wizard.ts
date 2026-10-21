import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useWizard } from "@/components/wizard/use-wizard";
import { ROUTES } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createEntityTypeAction } from "../actions";
import {
  type EntityTypeFormOutput,
  type EntityTypeFormValues,
  entityTypeFormDefaults,
  entityTypeFormSchema,
} from "./entity-type-form-schema";

export type EntityTypeStep = "base" | "capabilities";

const STEP_FIELDS = {
  base: ["base", "name"],
  capabilities: ["capabilities", "setupMinutes", "teardownMinutes"],
} as const;

/** Form and steps of the create-type wizard; only item types have the capabilities step. */
export function useEntityTypeWizard() {
  const t = useTranslations("entityType");
  const router = useRouter();
  const form = useForm<EntityTypeFormValues, unknown, EntityTypeFormOutput>({
    resolver: zodResolver(entityTypeFormSchema, useZodMessages()),
    defaultValues: entityTypeFormDefaults({}),
  });
  const { run, pending } = useFormAction({
    form,
    action: ({ values }) => createEntityTypeAction({ input: values }),
    messages: { pending: t("saving"), success: t("created") },
    onSuccess: ({ value }) => router.push(`${ROUTES.settingsTypes}/${value.id}`),
  });
  const steps: EntityTypeStep[] =
    form.watch("base") === "ITEM" ? ["base", "capabilities"] : ["base"];
  const wizard = useWizard({ form, steps, fieldsOf: ({ step }) => [...STEP_FIELDS[step]], run });
  return { ...wizard, form, steps, pending };
}
