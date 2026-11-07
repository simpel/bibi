import { STATUS_FLAGS } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import type { StatusRow } from "./status-rows";

/** `flag:` (what a status does) and `moves:` (any status, none, or a target's name). */
export function useStatusQualifiers(): TableQualifier<StatusRow>[] {
  const t = useTranslations("orderStatus");
  return useMemo(() => {
    const flags = STATUS_FLAGS.map((flag) => t(`flags.${flag}`));
    return [
      {
        key: "flag",
        label: t("columns.flags"),
        hint: flags.join(", "),
        pick: (row) => row.flags.map((flag) => t(`flags.${flag}`)),
        options: flags,
      },
      {
        key: "moves",
        label: t("columns.transitions"),
        hint: [t("anyStatus"), t("noTransitions")].join(", "),
        pick: (row) => {
          if (row.closes) return t("noTransitions");
          return row.restrictsNext ? row.targets : t("anyStatus");
        },
        options: [t("anyStatus"), t("noTransitions")],
      },
    ];
  }, [t]);
}
