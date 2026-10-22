"use client";

import type { EntityTypeDto } from "@bibi/core";
import { Button } from "@bibi/ui";
import { ArchiveIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchiveEntityTypeDialog } from "./archive-entity-type-dialog";

export type ArchiveEntityTypeButtonProps = { entityType: EntityTypeDto; redirectToList?: boolean };

/** Archive button (with confirmation) used in list rows and on the detail page. */
export function ArchiveEntityTypeButton({
  entityType,
  redirectToList,
}: ArchiveEntityTypeButtonProps) {
  const t = useTranslations("entityType");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <ArchiveIcon />
        {t("archive")}
      </Button>
      <ArchiveEntityTypeDialog
        entityType={entityType}
        redirectToList={redirectToList}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
