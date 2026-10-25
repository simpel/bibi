import {
  MemberProfileSetItemsInputSchema,
  MemberProfileUpdateInputSchema,
  type ScheduleKind,
} from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { setMemberProfileItemsAction, updateMemberProfileAction } from "../actions";

const SCHEMA = MemberProfileUpdateInputSchema.pick({ scheduleKind: true }).extend({
  itemIds: MemberProfileSetItemsInputSchema.shape.itemIds,
});

export type MemberWorkValues = { scheduleKind: ScheduleKind; itemIds: string[] };

export type UseMemberWorkFormInput = { memberId: string; saved: MemberWorkValues };

/** Schedule kind and linked staff items in one form; two commands, one toast (CLAUDE.md "Forms"). */
export function useMemberWorkForm({ memberId, saved }: UseMemberWorkFormInput) {
  const t = useTranslations("memberProfile");
  const router = useRouter();
  const form = useForm<MemberWorkValues>({
    resolver: zodResolver(SCHEMA, useZodMessages()),
    defaultValues: saved,
  });
  const { submit, pending } = useFormAction({
    form,
    action: async ({ values }) => {
      const updated = await updateMemberProfileAction({
        input: { memberId, scheduleKind: values.scheduleKind },
      });
      if (!updated.ok) return updated;
      return setMemberProfileItemsAction({ input: { memberId, itemIds: values.itemIds } });
    },
    messages: { pending: t("saving"), success: t("saved") },
    onSuccess: ({ values }) => {
      form.reset(values);
      router.refresh();
    },
  });
  return { form, submit, pending };
}
