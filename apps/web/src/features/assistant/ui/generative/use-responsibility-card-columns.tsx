import { Link } from "@bibi/i18n/navigation";
import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { responsibilitiesRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";

export type ResponsibilityCardRow = GenerativeProps<"responsibility-table">["items"][number];

/** Name (links to the responsibilities page) · what it covers. */
export function useResponsibilityCardColumns(): ColumnDef<ResponsibilityCardRow>[] {
  const t = useTranslations("assistant.ui.responsibility");
  return useMemo(
    () => [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (r) => r.name,
        cell: ({ row }) => (
          <Link href={responsibilitiesRoute()} className="font-medium hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      {
        id: "covers",
        header: t("columns.covers"),
        accessorFn: (r) => r.entityTypeIds.length,
        cell: ({ row }) =>
          t("covers", {
            types: row.original.entityTypeIds.length,
            followers: row.original.defaultFollowerIds.length,
          }),
      },
    ],
    [t],
  );
}
