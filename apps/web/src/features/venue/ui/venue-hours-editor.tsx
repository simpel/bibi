"use client";

import { useTranslations } from "next-intl";
import { type HoursPattern, HoursSectionForm } from "@/features/hours/ui/hours-section-form";
import { saveVenueHoursAction } from "../actions";

export type VenueHoursEditorProps = { venueId: string; initial: HoursPattern; canEdit: boolean };

/** The venue's opening hours: summary, the pencil beside its title, and saving through `venueHours.set`. */
export function VenueHoursEditor({ venueId, initial, canEdit }: VenueHoursEditorProps) {
  const t = useTranslations("venue.hours");
  return (
    <HoursSectionForm
      initial={initial}
      canEdit={canEdit}
      heading={{ title: t("title"), description: t("description"), editLabel: t("edit") }}
      emptyText={t("empty")}
      save={(input) => saveVenueHoursAction({ input: { venueId, ...input } })}
    />
  );
}
