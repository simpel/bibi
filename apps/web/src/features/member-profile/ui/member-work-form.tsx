"use client";

import { SCHEDULE_KINDS } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { StaffOption } from "../load-member-work";
import { StaffItemsField } from "./staff-items-field";
import { type MemberWorkValues, useMemberWorkForm } from "./use-member-work-form";

export type MemberWorkFormProps = {
  memberId: string;
  saved: MemberWorkValues;
  options: readonly StaffOption[];
};

/** Edit form for the work phone and email, the schedule kind and the linked staff items. */
export function MemberWorkForm({ memberId, saved, options }: MemberWorkFormProps) {
  const t = useTranslations("memberProfile");
  const { form, submit, pending } = useMemberWorkForm({ memberId, saved });
  const kinds = SCHEDULE_KINDS.map((id) => ({ id, name: t(`scheduleKinds.${id}`) }));
  return (
    <Form {...form}>
      <form onSubmit={submit} className="grid max-w-md gap-4">
        <p className="text-sm text-muted-foreground">{t("contactHint")}</p>
        <TextField form={form} name="phone" label={t("phone")} type="tel" autoComplete="off" />
        <TextField form={form} name="email" label={t("email")} type="email" autoComplete="off" />
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
