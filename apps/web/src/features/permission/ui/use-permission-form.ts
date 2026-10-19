import { zodResolver } from "@hookform/resolvers/zod";
import type { PermissionSet, PermissionUpdateInput } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { updatePermissionsAction } from "../actions";
import { cellKey, grantedKeys, setCell } from "../permission-grid";
import type { CellChange } from "./permission-cell";
import { type PermissionFormValues, permissionFormSchema } from "./permission-form-schema";

export type UsePermissionFormInput = {
  subjectType: "member" | "apiKey";
  subjectId: string;
  /** What the preset grants; only the differences are sent. */
  preset: PermissionSet;
  /** The effective permissions now (preset plus the saved overrides). */
  effective: PermissionSet;
};

/** The grid as an auto-saving form: every cell change saves at once, one toast per save. */
export function usePermissionForm({
  subjectType,
  subjectId,
  preset,
  effective,
}: UsePermissionFormInput) {
  const t = useTranslations("permissions");
  const common = useTranslations("common");
  const router = useRouter();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const schema = useMemo(
    () => permissionFormSchema({ subjectType, subjectId, preset }),
    [subjectType, subjectId, preset],
  );
  const saved = { granted: grantedKeys({ permissions: effective }) };
  const form = useForm<PermissionFormValues, unknown, PermissionUpdateInput>({
    resolver: zodResolver(schema, useZodMessages()),
    defaultValues: saved,
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => updatePermissionsAction({ input: values }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: ({ value }) => {
      form.reset({ granted: grantedKeys({ permissions: value.effective }) });
      router.refresh();
    },
    onError: () => form.reset(saved),
  });
  const change = async ({ feature, action, on }: CellChange) => {
    form.setValue("granted", setCell({ granted: form.getValues("granted"), feature, action, on }));
    setSavingKey(cellKey({ feature, action }));
    await submit();
    setSavingKey(null);
  };
  return { form, change, pending, savingKey: pending ? savingKey : null };
}
