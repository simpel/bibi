import { type ApiKeyDto, parseFixedRole } from "@okazi/core";
import { actionsColumn, type ColumnDef } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { ApiKeyRowActions } from "./api-key-row-actions";

type Column = ColumnDef<ApiKeyDto>;
type Translate = ReturnType<typeof useTranslations<"integration.apiKeys">>;
type Format = ReturnType<typeof useFormatter>;

type DateColumnInput = {
  id: "expires" | "lastUsed";
  t: Translate;
  format: Format;
  pick: (key: ApiKeyDto) => Date | null;
};

/** A date column; a missing date reads "never" and sorts last. */
const dateColumn = ({ id, t, format, pick }: DateColumnInput): Column => ({
  id,
  header: t(`columns.${id}`),
  accessorFn: (key) => pick(key) ?? undefined,
  cell: ({ row }) => {
    const value = pick(row.original);
    return value ? format.dateTime(value, { dateStyle: "medium" }) : t("never");
  },
});

const nameColumn = ({ t }: { t: Translate }): Column => ({
  id: "name",
  header: t("columns.name"),
  accessorFn: (key) => key.name,
  cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
});

const keyColumn = ({ t }: { t: Translate }): Column => ({
  id: "key",
  header: t("columns.key"),
  accessorFn: (key) => key.start ?? "",
  cell: ({ row }) => (
    <span className="font-mono text-xs">{row.original.start ? `${row.original.start}…` : ""}</span>
  ),
});

/** Name · key start · role · creator · expiry · last used, then the row actions. */
export type UseApiKeyColumnsInput = { canManage: boolean };

export function useApiKeyColumns({ canManage }: UseApiKeyColumnsInput): Column[] {
  const t = useTranslations("integration.apiKeys");
  const roles = useTranslations("role");
  const common = useTranslations("common");
  const format = useFormatter();
  return useMemo<Column[]>(
    () => [
      nameColumn({ t }),
      keyColumn({ t }),
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
      dateColumn({ id: "expires", t, format, pick: (key) => key.expiresAt }),
      dateColumn({ id: "lastUsed", t, format, pick: (key) => key.lastUsedAt }),
      ...(canManage
        ? [
            actionsColumn<ApiKeyDto>({
              label: common("actions"),
              cell: (key) => <ApiKeyRowActions apiKey={key} />,
            }),
          ]
        : []),
    ],
    [t, roles, common, format, canManage],
  );
}
