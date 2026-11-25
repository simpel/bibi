"use client";

import type { VenueDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ArchiveDangerArea } from "@/components/danger-area/archive-danger-area";
import { ArchiveVenueDialog } from "./archive-venue-dialog";

export type VenueDangerAreaProps = { venue: VenueDto };

/** The venue's danger area, last on its page: the only place it is archived. */
export function VenueDangerArea({ venue }: VenueDangerAreaProps) {
  const t = useTranslations("venue");
  return (
    <ArchiveDangerArea
      label={t("archive")}
      description={t("archiveConfirm", { name: venue.name })}
      dialog={(state) => <ArchiveVenueDialog venue={venue} {...state} />}
    />
  );
}
