"use client";

import type { ApiKeyDto } from "@bibi/core";
import { ContextMenuItem, DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { ExternalLinkIcon, PencilIcon, ShieldIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link, useRouter } from "@/lib/navigation";
import { apiKeyPermissionsRoute, apiKeyRoute, apiKeyUpdateRoute } from "@/lib/routes";
import { RevokeApiKeyDialog } from "./revoke-api-key-dialog";

export type ApiKeyRowActionsProps = { apiKey: ApiKeyDto };

/** Edit, permissions and revoke; requests with the key fail as soon as a revoke succeeds. */
export function ApiKeyRowActions({ apiKey }: ApiKeyRowActionsProps) {
  const t = useTranslations("integration.apiKeys");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <DataTableRowActions
        label={common("actions")}
        primary={[
          {
            label: t("edit"),
            icon: PencilIcon,
            onClick: () => router.push(apiKeyUpdateRoute({ id: apiKey.id })),
          },
        ]}
      >
        <DropdownMenuItem asChild>
          <Link href={apiKeyPermissionsRoute({ id: apiKey.id })}>{t("permissions")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={() => setOpen(true)}>
          {t("revoke")}
        </DropdownMenuItem>
      </DataTableRowActions>
      <RevokeApiKeyDialog apiKey={apiKey} open={open} onOpenChange={setOpen} />
    </>
  );
}

export type ApiKeyRowMenuProps = {
  apiKey: ApiKeyDto;
  canManage: boolean;
  /** Opens the confirmation; the dialog lives in the table so it outlives the menu. */
  onRevoke: (apiKey: ApiKeyDto) => void;
};

/** Right-click menu of one key, mirroring the row actions. */
export function ApiKeyRowMenu({ apiKey, canManage, onRevoke }: ApiKeyRowMenuProps) {
  const t = useTranslations("integration.apiKeys");
  const common = useTranslations("common");
  if (!canManage) {
    return (
      <ContextMenuItem asChild>
        <Link href={apiKeyRoute({ id: apiKey.id })}>
          <ExternalLinkIcon />
          {common("open")}
        </Link>
      </ContextMenuItem>
    );
  }
  return (
    <>
      <ContextMenuItem asChild>
        <Link href={apiKeyUpdateRoute({ id: apiKey.id })}>
          <PencilIcon />
          {t("edit")}
        </Link>
      </ContextMenuItem>
      <ContextMenuItem asChild>
        <Link href={apiKeyPermissionsRoute({ id: apiKey.id })}>
          <ShieldIcon />
          {t("permissions")}
        </Link>
      </ContextMenuItem>
      <ContextMenuItem destructive onSelect={() => onRevoke(apiKey)}>
        <XIcon />
        {t("revoke")}
      </ContextMenuItem>
    </>
  );
}
