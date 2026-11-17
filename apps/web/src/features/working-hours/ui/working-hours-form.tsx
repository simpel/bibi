"use client";

import type { HoursDay } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { HoursSectionForm } from "@/features/hours/ui/hours-section-form";
import { saveWorkingHoursAction } from "../actions";

export type WorkingHoursFormProps = { days: HoursDay[] };

/** The profile's working week: summary, Change, and saving through `workingHours.set`. */
export function WorkingHoursForm({ days }: WorkingHoursFormProps) {
  const t = useTranslations("profile");
  return (
    <HoursSectionForm
      initial={{ days, exceptions: [] }}
      canEdit
      emptyText={t("hoursEmpty")}
      withExceptions={false}
      save={({ days: next }) => saveWorkingHoursAction({ input: { days: next } })}
    />
  );
}
