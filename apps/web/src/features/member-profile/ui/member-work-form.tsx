"use client";

import { SCHEDULE_KINDS } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { OptionSelectField } from "@/components/form/option-select-field";
import type { StaffOption } from "../load-member-work";
import { StaffItemsField } from "./staff-items-field";
import { type MemberWorkValues, useMemberWorkForm } from "./use-member-work-form";

export type MemberWorkFormProps = {
  memberId: string;
  saved: MemberWorkValues;
  options: readonly StaffOption[];
};

/** Edit form for the schedule kind and the staff items linked to a member. */
export function MemberWorkForm({ memberId, saved, options }: MemberWorkFormProps) {
  const t = useTranslations("memberProfile");
  const { form, submit, pending } = useMemberWorkForm({ memberId, saved });
  const kinds = SCHEDULE_KINDS.map((id) => ({ id, name: t(`scheduleKinds.${id}`) }));
  return (
    <Form {...form}>
      <form onSubmit={submit} className="grid max-w-md gap-4">
        <OptionSelectField
          control={form.control}
          name="scheduleKind"
          label={t("scheduleKind")}
          options={kinds}
        />
        <StaffItemsField control={form.control} options={options} />
        <div>
          <Button type="submit" disabled={pending || !form.formState.isDirty}>
            {t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
