import type { OauthGrantDto } from "@okazi/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getFormatter, getTranslations } from "next-intl/server";
import { RevokeOauthGrantButton } from "./revoke-oauth-grant-button";

export type OauthGrantTableProps = { grants: OauthGrantDto[] };

export async function OauthGrantTable({ grants }: OauthGrantTableProps) {
  const t = await getTranslations("integration.oauthGrants");
  const common = await getTranslations("common");
  const format = await getFormatter();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.client")}</TableHead>
          <TableHead>{t("columns.scopes")}</TableHead>
          <TableHead>{t("columns.connected")}</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {grants.map((grant) => (
          <TableRow key={grant.clientId}>
            <TableCell className="font-medium">{grant.name}</TableCell>
            <TableCell className="font-mono text-xs">{grant.scopes.join(" ")}</TableCell>
            <TableCell>{format.dateTime(grant.connectedAt, { dateStyle: "medium" })}</TableCell>
            <TableCell>
              <RevokeOauthGrantButton grant={grant} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
