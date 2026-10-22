"use client";

import type { ApiKeyDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useApiKeyColumns } from "./use-api-key-columns";

export type ApiKeyTableProps = { apiKeys: ApiKeyDto[]; canManage: boolean };

/** Active keys; only the first characters of each key are known after creation. */
export function ApiKeyTable({ apiKeys, canManage }: ApiKeyTableProps) {
  const t = useTranslations("integration.apiKeys");
  const columns = useApiKeyColumns({ canManage });
  return (
    <PersistedDataTable
      tableId="api-key.list"
      columns={columns}
      data={apiKeys}
      getRowId={(apiKey) => apiKey.id}
      emptyText={t("empty")}
    />
  );
}
