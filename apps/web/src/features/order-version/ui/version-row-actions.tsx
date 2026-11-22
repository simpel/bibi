"use client";

import type { OrderVersionDto } from "@bibi/core/schemas";
import { ContextMenuItem, DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { HistoryIcon, TagIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type VersionRowHandlers = {
  onShow: (input: { version: OrderVersionDto }) => void;
  /** Left out without `program:write`. */
  onName?: (input: { version: OrderVersionDto }) => void;
};

type RowProps = VersionRowHandlers & { version: OrderVersionDto };

/** Show changes (and restore from there) and name, in the table's actions column. */
export function VersionRowActions({ version, onShow, onName }: RowProps) {
  const t = useTranslations("orderVersion");
  const common = useTranslations("common");
  const primary = [
    { label: t("showChanges"), icon: HistoryIcon, onClick: () => onShow({ version }) },
  ];
  return (
    <DataTableRowActions label={common("actions")} primary={primary}>
      {onName ? (
        <DropdownMenuItem onSelect={() => onName({ version })}>
          <TagIcon />
          {t(version.name ? "rename" : "name")}
        </DropdownMenuItem>
      ) : null}
    </DataTableRowActions>
  );
}

/** The same actions on right-click (apps/web/CLAUDE.md, Tables). */
export function VersionRowMenu({ version, onShow, onName }: RowProps) {
  const t = useTranslations("orderVersion");
  return (
    <>
      <ContextMenuItem onSelect={() => onShow({ version })}>{t("showChanges")}</ContextMenuItem>
      {onName ? (
        <ContextMenuItem onSelect={() => onName({ version })}>
          {t(version.name ? "rename" : "name")}
        </ContextMenuItem>
      ) : null}
    </>
  );
}
