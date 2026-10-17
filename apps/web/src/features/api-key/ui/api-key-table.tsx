"use client";

import type { ApiKeyDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useApiKeyColumns } from "./use-api-key-columns";

export type ApiKeyTableProps = { apiKeys: ApiKeyDto[] };

/** Active keys; only the first characters of each key are known after creation. */
export function ApiKeyTable({ apiKeys }: ApiKeyTableProps) {
  const t = useTranslations("integration.apiKeys");
  const columns = useApiKeyColumns();
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
