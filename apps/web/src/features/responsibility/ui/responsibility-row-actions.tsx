"use client";

import type { ResponsibilityDto } from "@okazi/core";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@okazi/ui";
import { MoreHorizontalIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchiveResponsibilityDialog } from "./archive-responsibility-dialog";
import { ResponsibilityDialog } from "./responsibility-dialog";
import type { ResponsibilityOptions } from "./responsibility-options";

export type ResponsibilityRowActionsProps = {
  responsibility: ResponsibilityDto;
  options: ResponsibilityOptions;
};

/** Edit / archive menu for one responsibility. */
export function ResponsibilityRowActions({
  responsibility,
  options,
}: ResponsibilityRowActionsProps) {
  const t = useTranslations("responsibility");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={common("actions")}>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialog("edit")}>{t("edit")}</DropdownMenuItem>
          <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
            {t("archive")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ResponsibilityDialog
        responsibility={responsibility}
        options={options}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveResponsibilityDialog
        responsibility={responsibility}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
