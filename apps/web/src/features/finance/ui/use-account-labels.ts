import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { type AccountRow, rowGroup } from "../lib/account-rows";
import type { ItemTypeOption } from "../lib/accounting-form";

export type UseAccountLabelsInput = { types: ItemTypeOption[] };

/** The name and group of an account row as the user reads them (columns, search, qualifiers). */
export function useAccountLabels({ types }: UseAccountLabelsInput) {
  const t = useTranslations("finance.accounting");
  return useMemo(
    () => ({
      name: ({ target }: AccountRow): string => {
        if (target.kind === "account") return t(`fields.${target.key}`);
        const entityTypeId = target.entityTypeId;
        return types.find(({ id }) => id === entityTypeId)?.name ?? "–";
      },
      group: ({ target }: AccountRow): string | undefined =>
        target.kind === "account" ? t(`groups.${rowGroup({ key: target.key })}`) : undefined,
    }),
    [t, types],
  );
}

export type AccountLabels = ReturnType<typeof useAccountLabels>;
