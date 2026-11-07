import { type ApiKeyDto, type DateTimeFormat, parseFixedRole } from "@bibi/core/schemas";
import { actionsColumn, type ColumnDef, createTableColumns, dateColumn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Link } from "@/lib/navigation";
import { apiKeyRoute } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { ApiKeyRowActions } from "./api-key-row-actions";

type Column = ColumnDef<ApiKeyDto>;
type Translate = ReturnType<typeof useTranslations<"integration.apiKeys">>;

type OptionalDateInput = {
  id: "createdAt" | "expires" | "lastUsed";
  t: Translate;
  format: DateTimeFormat;
  pick: (key: ApiKeyDto) => Date | null;
  /** Sort value of a missing date: first for "never used", last for "never expires". */
  missing: number;
};

/** A date column; a missing date reads "never". */
const optionalDate = ({ id, t, format, pick, missing }: OptionalDateInput): Column =>
  dateColumn<ApiKeyDto>({
    id,
    header: t(`columns.${id}`),
    getSortValue: (key) => pick(key)?.getTime() ?? missing,
    cell: (key) => {
      const value = pick(key);
      return value ? format.date({ instant: value }) : t("never");
    },
  });

/** Name · key start · role · creator · created · expiry · last used, then the row actions. */
export type UseApiKeyColumnsInput = { canManage: boolean };

export function useApiKeyColumns({ canManage }: UseApiKeyColumnsInput): Column[] {
  const t = useTranslations("integration.apiKeys");
  const roles = useTranslations("role");
  const common = useTranslations("common");
  const format = useDateTimeFormat();
  return useMemo<Column[]>(
    () =>
      createTableColumns<ApiKeyDto>({
        primary: [
          {
            id: "name",
            header: t("columns.name"),
            accessorFn: (key) => key.name,
            cell: ({ row }) => (
              <Link
                href={apiKeyRoute({ id: row.original.id })}
                className="font-medium hover:underline"
              >
                {row.original.name}
              </Link>
            ),
          },
        ],
        relations: [
          {
            id: "key",
            header: t("columns.key"),
            accessorFn: (key) => key.start ?? "",
            cell: ({ row }) => (
              <span className="font-mono text-xs">
                {row.original.start ? `${row.original.start}…` : ""}
              </span>
            ),
          },
          {
            id: "role",
            header: t("columns.role"),
            accessorFn: (key) => roles(parseFixedRole({ role: key.role }) ?? "unknown"),
          },
          {
            id: "createdBy",
            header: t("columns.createdBy"),
            accessorFn: (key) => key.createdByName ?? t("unknownCreator"),
          },
        ],
        dates: [
          optionalDate({ id: "createdAt", t, format, pick: (key) => key.createdAt, missing: 0 }),
          optionalDate({
            id: "expires",
            t,
            format,
            pick: (key) => key.expiresAt,
            missing: Number.MAX_SAFE_INTEGER,
          }),
          optionalDate({ id: "lastUsed", t, format, pick: (key) => key.lastUsedAt, missing: 0 }),
        ],
        actions: canManage
          ? [
              actionsColumn<ApiKeyDto>({
                label: common("actions"),
                cell: (key) => <ApiKeyRowActions apiKey={key} />,
              }),
            ]
          : [],
      }),
    [t, roles, common, format, canManage],
  );
}
