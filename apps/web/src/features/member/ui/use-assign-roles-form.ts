import { zodResolver } from "@hookform/resolvers/zod";
import type { MemberDto } from "@okazi/core";
import { MemberAssignRoleInputSchema } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { assignMemberRolesAction } from "../actions";

const SCHEMA = MemberAssignRoleInputSchema.pick({ roles: true });

export type AssignRolesValues = { roles: string[] };

export type UseAssignRolesFormInput = { member: MemberDto; onDone: () => void };

/** The member's role names as a form; saving replaces them (CLAUDE.md "Formulär"). */
export function useAssignRolesForm({ member, onDone }: UseAssignRolesFormInput) {
  const t = useTranslations("member");
  const router = useRouter();
  const form = useForm<AssignRolesValues>({
    resolver: zodResolver(SCHEMA, useZodMessages()),
    defaultValues: { roles: member.roles },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => assignMemberRolesAction({ id: member.id, roles: values.roles }),
    messages: { pending: t("saving"), success: t("updated") },
    onSuccess: () => {
      onDone();
      router.refresh();
    },
  });
  return { form, submit, pending };
}
