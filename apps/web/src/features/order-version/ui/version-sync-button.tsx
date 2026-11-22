"use client";

import { Button } from "@bibi/ui";
import { type ReactNode, useState } from "react";
import { VersionDialog } from "./version-dialog";

export type VersionSyncButtonProps = {
  versionId: string;
  title: string;
  canRestore: boolean;
  children: ReactNode;
};

/** The sync line's "Show changes": the version's restore dialog. */
export function VersionSyncButton({
  versionId,
  title,
  canRestore,
  children,
}: VersionSyncButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setOpen(true)}>
        {children}
      </Button>
      <VersionDialog
        versionId={versionId}
        title={title}
        open={open}
        onOpenChange={setOpen}
        canRestore={canRestore}
      />
    </>
  );
}
