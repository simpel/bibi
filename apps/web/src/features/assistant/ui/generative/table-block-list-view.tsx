"use client";

import { TableBlockList } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type TableBlockListViewProps = GenerativeProps<"table-block-list">;

/** Held-back tables: which, how, when and why. */
export function TableBlockListView({ items }: TableBlockListViewProps) {
  const t = useTranslations("assistant.ui.reservation");
  const dates = useDateTimeFormat();
  return (
    <TableBlockList
      emptyLabel={t("noBlocks")}
      tablesLabel={t("table")}
      items={items.map((block) => ({
        id: block.id,
        tables: [block.label ?? "–"],
        kind: t(`kind.${block.kind}`),
        blocking: block.kind === "BLOCK",
        period: `${dates.date({ instant: block.startsAt, weekday: "short" })} ${dates.timeRange({ start: block.startsAt, end: block.endsAt })}`,
        note: block.note,
      }))}
    />
  );
}
