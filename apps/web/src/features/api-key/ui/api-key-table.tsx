"use client";

import { type ApiKeyDto, parseFixedRole } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import { useRouter } from "@/lib/navigation";
import { apiKeyRoute } from "@/lib/routes";
import { ApiKeyRowMenu } from "./api-key-row-actions";
import { RevokeApiKeyDialog } from "./revoke-api-key-dialog";
import { useApiKeyColumns } from "./use-api-key-columns";

export type ApiKeyTableProps = { apiKeys: ApiKeyDto[]; canManage: boolean };

const PRESETS = ["admin", "manager", "member"] as const;

function useApiKeyQualifiers({ apiKeys }: { apiKeys: ApiKeyDto[] }): TableQualifier<ApiKeyDto>[] {
  const t = useTranslations("integration.apiKeys");
  const roles = useTranslations("role");
  return useMemo(
    () => [
      {
        key: "role",
        label: t("columns.role"),
        hint: PRESETS.map((r) => roles(r)).join(", "),
        pick: (k) => roles(parseFixedRole({ role: k.role }) ?? "unknown"),
        options: PRESETS.map((r) => roles(r)),
      },
      {
        key: "name",
        label: t("columns.name"),
        hint: t("columns.name"),
        pick: (k) => k.name,
        options: apiKeys.map((k) => k.name),
      },
      {
        key: "creator",
        label: t("columns.createdBy"),
        hint: t("columns.createdBy"),
        pick: (k) => k.createdByName ?? t("unknownCreator"),
        options: Array.from(new Set(apiKeys.map((k) => k.createdByName ?? t("unknownCreator")))),
      },
    ],
    [t, roles, apiKeys],
  );
}

/** Active keys; only the first characters of each key are known after creation. */
export function ApiKeyTable({ apiKeys, canManage }: ApiKeyTableProps) {
  const t = useTranslations("integration.apiKeys");
  const roles = useTranslations("role");
  const router = useRouter();
  const [revoking, setRevoking] = useState<ApiKeyDto | null>(null);
  const qualifiers = useApiKeyQualifiers({ apiKeys });
  const view = useClientTableView({
    rows: apiKeys,
    qualifiers,
    getSearchText: (k) =>
      `${k.name} ${k.start ?? ""} ${roles(parseFixedRole({ role: k.role }) ?? "unknown")} ${k.createdByName ?? ""}`,
    totalLabel: (count) => `${count}`,
  });
  const columns = useApiKeyColumns({ canManage });
  return (
    <div className="grid gap-4">
      <TableFilterBar q={view.q} query={view.query} />
      <PersistedDataTable
        tableId="api-key.list"
        columns={columns}
        data={view.rows}
        getRowId={(apiKey) => apiKey.id}
        onRowClick={(apiKey) => router.push(apiKeyRoute({ id: apiKey.id }))}
        rowMenu={(apiKey) => (
          <ApiKeyRowMenu apiKey={apiKey} canManage={canManage} onRevoke={setRevoking} />
        )}
        emptyText={t("empty")}
        pagination={view.pagination}
      />
      {revoking ? (
        <RevokeApiKeyDialog
          apiKey={revoking}
          open
          onOpenChange={(open) => !open && setRevoking(null)}
        />
      ) : null}
    </div>
  );
}
