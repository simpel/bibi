import { type FixedRole, MemberAssignRoleInputSchema } from "@bibi/core/schemas";
import { useRouter } from "@bibi/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { changePresetAction } from "../actions";

/** Core's fixed-role schema; members and API keys share the same presets. */
const SCHEMA = MemberAssignRoleInputSchema.pick({ role: true });

export type PresetFormValues = { role: FixedRole };

export type UsePresetFormInput = {
  subjectType: "member" | "apiKey";
  subjectId: string;
  preset: FixedRole | null;
};

/** The preset select: a pick asks first, confirming saves and resets every permission. */
export function usePresetForm({ subjectType, subjectId, preset }: UsePresetFormInput) {
  const t = useTranslations("permissions");
  const common = useTranslations("common");
  const roleLabel = useTranslations("role");
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const saved = { role: preset ?? "member" } as const;
  const form = useForm<PresetFormValues>({
    resolver: zodResolver(SCHEMA, useZodMessages()),
    defaultValues: saved,
  });
  const restore = () => form.reset(saved);
  const picked = roleLabel(form.watch("role"));
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => changePresetAction({ subjectType, subjectId, preset: values.role }),
    messages: { pending: common("saving"), success: t("presetSaved", { preset: picked }) },
    onSuccess: ({ values }) => {
      form.reset(values);
      router.refresh();
    },
    onError: restore,
  });
  const confirm = () => {
    setConfirming(false);
    void submit();
  };
  const cancel = () => {
    restore();
    setConfirming(false);
  };
  const pick = () => setConfirming(true);
  return { form, picked, pending, confirming, pick, confirm, cancel };
}
