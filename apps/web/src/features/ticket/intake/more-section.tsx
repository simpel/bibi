import { useTranslations } from "next-intl";
import { DateTimeField } from "@/components/date-picker/date-time-field";
import { OptionSelectField } from "@/components/form/option-select-field";
import type { IntakeCatalog } from "./catalog";
import type { ReviewForm } from "./use-review-form";

export type MoreSectionProps = { form: ReviewForm; catalog: IntakeCatalog };

/** Assignee (the creating member unless chosen) and holds until, always shown. */
export function MoreSection({ form, catalog }: MoreSectionProps) {
  const t = useTranslations("ticketIntake.more");
  const me = catalog.members.find(({ id }) => id === catalog.userId)?.name;
  const others = catalog.members.filter(({ id }) => id !== catalog.userId);
  return (
    <div className="grid items-start gap-4 sm:grid-cols-2">
      <OptionSelectField
        control={form.control}
        name="assigneeId"
        label={t("assignee")}
        options={others}
        noneLabel={me ? t("me", { name: me }) : t("meUnnamed")}
      />
      <DateTimeField form={form} name="holdsUntil" label={t("holdsUntil")} />
    </div>
  );
}
