"use client";

import type { VocabularyDto } from "@okazi/core";
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
import { ArchiveVocabularyDialog } from "./archive-vocabulary-dialog";
import { VocabularyDialog } from "./vocabulary-dialog";

export type VocabularyRowActionsProps = { vocabulary: VocabularyDto; redirectToList?: boolean };

/** Rename / archive menu for one list. */
export function VocabularyRowActions({ vocabulary, redirectToList }: VocabularyRowActionsProps) {
  const t = useTranslations("vocabulary");
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
      <VocabularyDialog
        vocabulary={vocabulary}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveVocabularyDialog
        vocabulary={vocabulary}
        redirectToList={redirectToList}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
