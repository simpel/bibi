"use client";

import { useTranslations } from "next-intl";
import { type HoursPattern, HoursSectionForm } from "@/features/hours/ui/hours-section-form";
import { saveItemHoursAction } from "../actions";

export type ItemHoursEditorProps = { itemId: string; initial: HoursPattern; canEdit: boolean };

/** The item's working hours: summary, the pencil beside its title, and saving through `itemHours.set`. */
export function ItemHoursEditor({ itemId, initial, canEdit }: ItemHoursEditorProps) {
  const t = useTranslations("item.hours");
  return (
    <HoursSectionForm
      initial={initial}
      canEdit={canEdit}
      heading={{ title: t("title"), description: t("description"), editLabel: t("edit") }}
      emptyText={t("followsVenue")}
      hint={t("followHint")}
      save={(input) => saveItemHoursAction({ input: { itemId, ...input } })}
    />
  );
}
