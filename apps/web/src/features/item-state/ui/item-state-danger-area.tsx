"use client";

import type { ItemStateDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { ArchiveDangerArea } from "@/components/danger-area/archive-danger-area";
import { ArchiveItemStateDialog } from "./archive-item-state-dialog";

export type ItemStateDangerAreaProps = {
  state: ItemStateDto;
  /** The type's active states: the others are where the state's lines can move. */
  states: readonly ItemStateDto[];
};

/** The state's danger area, last on its page: the only place it is archived. */
export function ItemStateDangerArea({ state, states }: ItemStateDangerAreaProps) {
  const t = useTranslations("itemState");
  return (
    <ArchiveDangerArea
      label={t("archive")}
      description={t(state.initial ? "archiveInitialConfirm" : "archiveConfirm", {
        name: state.name,
      })}
      dialog={(dialogState) => (
        <ArchiveItemStateDialog state={state} states={states} {...dialogState} />
      )}
    />
  );
}
