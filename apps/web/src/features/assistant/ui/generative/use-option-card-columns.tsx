import { Link } from "@okazi/i18n/navigation";
import type { ColumnDef } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { OptionStatusBadge } from "@/features/option/ui/option-status-badge";
import { itemRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";
import { occupancyPeriod } from "./occupancy-period";

export type OptionCardRow = GenerativeProps<"option-queue">["items"][number];

/** Rank (or final status) · held period (links to the item) · expiry. */
export function useOptionCardColumns(): ColumnDef<OptionCardRow>[] {
  const t = useTranslations("assistant.ui.option");
  const format = useFormatter();
  return useMemo(
    () => [
      {
        id: "rank",
        header: t("columns.rank"),
        accessorFn: (o) => o.rank ?? Number.MAX_SAFE_INTEGER,
        cell: ({ row }) => (
          <OptionStatusBadge status={row.original.optionStatus} rank={row.original.rank} />
        ),
      },
      {
        id: "period",
        header: t("columns.period"),
        accessorFn: (o) => new Date(o.startsAt),
        cell: ({ row }) => (
          <Link
            href={itemRoute({ id: row.original.itemId })}
            className="font-medium hover:underline"
          >
            {occupancyPeriod({ format, ...row.original })}
          </Link>
        ),
      },
      {
        id: "expiresAt",
        header: t("columns.expiresAt"),
        accessorFn: (o) => new Date(o.expiresAt),
        cell: ({ row }) =>
          format.dateTime(new Date(row.original.expiresAt), {
            dateStyle: "medium",
            timeStyle: "short",
          }),
      },
    ],
    [t, format],
  );
}
