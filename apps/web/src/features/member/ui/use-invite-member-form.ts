import { type FixedRole, MemberInviteInputSchema } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { inviteMemberAction } from "../actions";

export type InviteMemberValues = { email: string; role: FixedRole };

export type UseInviteMemberFormInput = { onDone: () => void };

/** Email + fixed role; submitting creates the invitation and mails the link (CLAUDE.md "Forms"). */
export function useInviteMemberForm({ onDone }: UseInviteMemberFormInput) {
  const t = useTranslations("member");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<InviteMemberValues>({
    resolver: zodResolver(MemberInviteInputSchema, useZodMessages()),
    defaultValues: { email: "", role: "manager" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => inviteMemberAction(values),
    messages: { pending: common("sending"), success: t("invited") },
    onSuccess: () => {
      onDone();
      router.refresh();
    },
  });
  return { form, submit, pending };
}
