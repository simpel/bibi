import { STATE_FLAGS } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import type { TypedStateRow } from "./state-rows";
import { flagLabels } from "./use-state-columns";

export type StateQualifiersInput = { typeNames: readonly string[] };

/** `type:` (the item type) and `flag:` (what the state does). */
export function useStateQualifiers({ typeNames }: StateQualifiersInput) {
  const t = useTranslations("itemState");
  return useMemo<TableQualifier<TypedStateRow>[]>(() => {
    const flags = [
      ...STATE_FLAGS.map((flag) => t(`flags.${flag}`)),
      t("holds.SOFT"),
      t("holds.HARD"),
    ];
    return [
      {
        key: "type",
        label: t("columns.type"),
        hint: typeNames.join(", "),
        pick: (row) => row.typeName,
        options: typeNames,
      },
      {
        key: "flag",
        label: t("columns.flags"),
        hint: flags.join(", "),
        pick: (row) => flagLabels({ t, row }),
        options: flags,
      },
    ];
  }, [t, typeNames]);
}
