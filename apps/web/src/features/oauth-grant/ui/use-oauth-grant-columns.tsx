import type { OauthGrantDto } from "@bibi/core";
import { actionsColumn, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { OauthGrantRowActions } from "./oauth-grant-row-actions";

type Column = ColumnDef<OauthGrantDto>;

/** Client · scopes · connected, then the row actions. */
export function useOauthGrantColumns(): Column[] {
  const t = useTranslations("integration.oauthGrants");
  const common = useTranslations("common");
  const format = useDateTimeFormat();
  return useMemo<Column[]>(
    () => [
      {
        id: "client",
        header: t("columns.client"),
        accessorFn: (grant) => grant.name,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        id: "scopes",
        header: t("columns.scopes"),
        accessorFn: (grant) => grant.scopes.join(" "),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.scopes.join(" ")}</span>
        ),
      },
      {
        id: "connected",
        header: t("columns.connected"),
        accessorFn: (grant) => grant.connectedAt,
        cell: ({ row }) => format.date({ instant: row.original.connectedAt }),
      },
      actionsColumn<OauthGrantDto>({
        label: common("actions"),
        cell: (grant) => <OauthGrantRowActions grant={grant} />,
      }),
    ],
    [t, common, format],
  );
}
