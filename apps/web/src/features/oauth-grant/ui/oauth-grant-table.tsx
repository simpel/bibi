"use client";

import type { OauthGrantDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useOauthGrantColumns } from "./use-oauth-grant-columns";

export type OauthGrantTableProps = { grants: OauthGrantDto[] };

/** The apps the signed-in user has connected with OAuth. */
export function OauthGrantTable({ grants }: OauthGrantTableProps) {
  const t = useTranslations("integration.oauthGrants");
  const columns = useOauthGrantColumns();
  return (
    <PersistedDataTable
      tableId="oauth-grant.list"
      columns={columns}
      data={grants}
      getRowId={(grant) => grant.clientId}
      emptyText={t("empty")}
    />
  );
}
