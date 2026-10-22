import type { FixedRole, MemberDto } from "@bibi/core";
import { MemberAssignRoleInputSchema } from "@bibi/core/schemas";
import { useRouter } from "@bibi/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { assignMemberRoleAction } from "../actions";

const SCHEMA = MemberAssignRoleInputSchema.pick({ role: true });

export type AssignRoleValues = { role: FixedRole };

export type UseAssignRoleFormInput = { member: MemberDto };

/** The member's fixed role as an auto-saving form; on error the select goes back (CLAUDE.md "Forms"). */
export function useAssignRoleForm({ member }: UseAssignRoleFormInput) {
  const t = useTranslations("member");
  const router = useRouter();
  const saved = { role: member.role ?? "member" } as const;
  const form = useForm<AssignRoleValues>({
    resolver: zodResolver(SCHEMA, useZodMessages()),
    defaultValues: saved,
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => assignMemberRoleAction({ id: member.id, role: values.role }),
    messages: { pending: t("saving"), success: t("updated") },
    onSuccess: ({ values }) => {
      form.reset(values);
      router.refresh();
    },
    onError: () => form.reset(saved),
  });
  return { form, submit, pending };
}
