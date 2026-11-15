"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import { buildTableQuery } from "@/components/data-table/table-filter-query";
import { myWorkQualifiers } from "../lib/my-work-query";
import type { MyWorkCardWireish } from "./my-work-wireish";

export type MyWorkSearchProps = {
  q: string | undefined;
  cards: readonly MyWorkCardWireish[];
  /** The member's views, left of the search. */
  children?: ReactNode;
};

/** My work's search box, as on the tables: free text and `status:`, `customer:`, `place:`. */
export function MyWorkSearch({ q, cards, children }: MyWorkSearchProps) {
  const t = useTranslations("myWork.search");
  const query = useMemo(
    () =>
      buildTableQuery({
        qualifiers: myWorkQualifiers({
          cards,
          labels: { status: t("status"), customer: t("customer"), place: t("place") },
        }),
      }),
    [cards, t],
  );
  return (
    <TableFilterBar q={q} query={query} placeholder={t("placeholder")}>
      {children}
    </TableFilterBar>
  );
}
