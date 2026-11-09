import type { FixedRole, MemberDto } from "@bibi/core";
import { FIXED_ROLES, MemberAssignRoleInputSchema } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { assignMemberRoleAction } from "../actions";

const SCHEMA = MemberAssignRoleInputSchema.pick({ role: true });

export type AssignRoleValues = { role: FixedRole };

export type UseAssignRoleFormInput = { member: MemberDto };

const rank = ({ role }: { role: FixedRole }) => FIXED_ROLES.indexOf(role);

/**
 * The member's fixed role as an auto-saving form; on error the select goes back (CLAUDE.md
 * "Forms"). A lower role removes access, so it asks first; a higher one saves at once.
 */
export function useAssignRoleForm({ member }: UseAssignRoleFormInput) {
  const t = useTranslations("member");
  const router = useRouter();
  const saved = { role: member.role ?? "member" } as const;
  const form = useForm<AssignRoleValues>({
    resolver: zodResolver(SCHEMA, useZodMessages()),
    defaultValues: saved,
  });
  const [lowering, setLowering] = useState(false);
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => assignMemberRoleAction({ id: member.id, role: values.role }),
    messages: { pending: t("saving"), success: t("updated") },
    onSuccess: ({ values }) => {
      setLowering(false);
      form.reset(values);
      router.refresh();
    },
    onError: () => form.reset(saved),
  });
  const pick = () => {
    if (rank({ role: form.getValues("role") }) < rank({ role: saved.role })) setLowering(true);
    else void submit();
  };
  const confirm = () => void submit();
  const cancel = () => {
    setLowering(false);
    form.reset(saved);
  };
  return { form, pending, pick, lowering, confirm, cancel, from: saved.role };
}
