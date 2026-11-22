"use client";

import type { OrderVersionDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { NameVersionDialog } from "./name-version-dialog";
import { useVersionColumns } from "./use-version-columns";
import { VersionDialog } from "./version-dialog";
import { VersionRowMenu } from "./version-row-actions";

export type VersionTableProps = {
  versions: readonly OrderVersionDto[];
  /** `program:write`: restore and name. */
  canEdit: boolean;
};

type Open = { kind: "show" | "name"; version: OrderVersionDto } | null;

/** The order's versions, newest first (ADR 0116), with the restore and name dialogs. */
export function VersionTable({ versions, canEdit }: VersionTableProps) {
  const t = useTranslations("orderVersion");
  const [open, setOpen] = useState<Open>(null);
  const onShow = useCallback(
    ({ version }: { version: OrderVersionDto }) => setOpen({ kind: "show", version }),
    [],
  );
  const onName = useCallback(
    ({ version }: { version: OrderVersionDto }) => setOpen({ kind: "name", version }),
    [],
  );
  const handlers = canEdit ? { onShow, onName } : { onShow };
  const columns = useVersionColumns(handlers);
  return (
    <>
      <PersistedDataTable
        tableId="order.versions"
        columns={columns}
        data={[...versions]}
        getRowId={(version) => version.id}
        emptyText={t("empty")}
        rowMenu={(version) => <VersionRowMenu version={version} {...handlers} />}
      />
      {open?.kind === "show" ? (
        <VersionDialog
          versionId={open.version.id}
          title={t("versionLabel", { number: open.version.number })}
          open
          onOpenChange={(next) => (next ? undefined : setOpen(null))}
          canRestore={canEdit}
        />
      ) : null}
      {open?.kind === "name" ? (
        <NameVersionDialog
          version={open.version}
          open
          onOpenChange={(next) => (next ? undefined : setOpen(null))}
        />
      ) : null}
    </>
  );
}
