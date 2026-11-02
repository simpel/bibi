import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from "@bibi/ui";
import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { DateTimeField } from "@/components/date-picker/date-time-field";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { IntakeCatalog } from "./catalog";
import type { ReviewForm } from "./use-review-form";

export type MoreSectionProps = { form: ReviewForm; catalog: IntakeCatalog };

/** Collapsed: assignee (the creating member unless chosen), holds until and estimated value. */
export function MoreSection({ form, catalog }: MoreSectionProps) {
  const t = useTranslations("ticketIntake.more");
  const me = catalog.members.find(({ id }) => id === catalog.userId)?.name;
  const others = catalog.members.filter(({ id }) => id !== catalog.userId);
  return (
    <Collapsible className="grid gap-3">
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="justify-self-start">
          {t("title")}
          <ChevronDownIcon aria-hidden="true" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="grid gap-4 sm:grid-cols-3">
        <OptionSelectField
          control={form.control}
          name="assigneeId"
          label={t("assignee")}
          options={others}
          noneLabel={me ? t("me", { name: me }) : t("meUnnamed")}
        />
        <DateTimeField form={form} name="holdsUntil" label={t("holdsUntil")} />
        <TextField
          form={form}
          name="estimatedValue"
          label={t("estimatedValue")}
          type="number"
          step="0.01"
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
