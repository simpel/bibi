import { zodResolver } from "@hookform/resolvers/zod";
import type { RoleCreateInput, RoleDto } from "@okazi/core";
import { RoleCreateInputSchema } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createRoleAction, updateRoleAction } from "../actions";

export type UseRoleFormInput = { role?: RoleDto | undefined; onDone: () => void };

/** Create (no `role`) or edit: core's role schema, one toast per save (CLAUDE.md "Formulär"). */
export function useRoleForm({ role, onDone }: UseRoleFormInput) {
  const t = useTranslations("role");
  const router = useRouter();
  const form = useForm<RoleCreateInput>({
    resolver: zodResolver(RoleCreateInputSchema, useZodMessages()),
    defaultValues: { name: role?.name ?? "", permissions: role?.permissions ?? {} },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      role
        ? updateRoleAction({ input: { id: role.id, ...values } })
        : createRoleAction({ input: values }),
    messages: { pending: t("saving"), success: t(role ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return { form, submit, pending };
}
