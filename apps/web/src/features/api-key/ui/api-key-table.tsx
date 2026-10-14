import { type ApiKeyDto, parseFixedRole } from "@okazi/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getFormatter, getTranslations } from "next-intl/server";
import { RevokeApiKeyButton } from "./revoke-api-key-button";

export type ApiKeyTableProps = { apiKeys: ApiKeyDto[] };

const COLUMNS = ["name", "key", "role", "owner", "expires", "lastUsed"] as const;

/** Active keys; only the first characters of each key are known after creation. */
export async function ApiKeyTable({ apiKeys }: ApiKeyTableProps) {
  const t = await getTranslations("integration.apiKeys");
  const common = await getTranslations("common");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {COLUMNS.map((column) => (
            <TableHead key={column}>{t(`columns.${column}`)}</TableHead>
          ))}
          <TableHead className="w-12">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {apiKeys.map((apiKey) => (
          <ApiKeyRow key={apiKey.id} apiKey={apiKey} />
        ))}
      </TableBody>
    </Table>
  );
}

type ApiKeyRowProps = { apiKey: ApiKeyDto };

async function ApiKeyRow({ apiKey }: ApiKeyRowProps) {
  const t = await getTranslations("integration.apiKeys");
  const roles = await getTranslations("role");
  const format = await getFormatter();
  const role = parseFixedRole({ role: apiKey.role });
  const date = ({ value }: { value: Date | null }) =>
    value ? format.dateTime(value, { dateStyle: "medium" }) : t("never");
  return (
    <TableRow>
      <TableCell className="font-medium">{apiKey.name}</TableCell>
      <TableCell className="font-mono text-xs">{apiKey.start ? `${apiKey.start}…` : ""}</TableCell>
      <TableCell>{role ? roles(role) : roles("unknown")}</TableCell>
      <TableCell>{apiKey.ownerName ?? t("unknownOwner")}</TableCell>
      <TableCell>{date({ value: apiKey.expiresAt })}</TableCell>
      <TableCell>{date({ value: apiKey.lastUsedAt })}</TableCell>
      <TableCell>
        <RevokeApiKeyButton apiKey={apiKey} />
      </TableCell>
    </TableRow>
  );
}
