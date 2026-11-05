"use client";

import type { VocabularyDto } from "@bibi/core";
import { ContextMenuItem, DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { ExternalLinkIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { vocabularyRoute } from "@/lib/configuration-routes";
import { Link, useRouter } from "@/lib/navigation";
import { ArchiveVocabularyDialog } from "./archive-vocabulary-dialog";
import { VocabularyDialog } from "./vocabulary-dialog";

export type VocabularyRowActionsProps = {
  vocabulary: VocabularyDto;
  redirectToList?: boolean;
  access: RowAccess;
};

/** Rename / archive menu for one list. */
export function VocabularyRowActions({
  vocabulary,
  redirectToList,
  access,
}: VocabularyRowActionsProps) {
  const t = useTranslations("vocabulary");
  const common = useTranslations("common");
  const router = useRouter();
  const detail = vocabularyRoute({ id: vocabulary.id });
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  const primary = access.canEdit
    ? [{ label: t("edit"), icon: PencilIcon, onClick: () => setDialog("edit") }]
    : [{ label: common("open"), icon: ExternalLinkIcon, onClick: () => router.push(detail) }];
  return (
    <>
      <DataTableRowActions label={common("actions")} primary={primary}>
        {access.canRemove ? (
          <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
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

/** Right-click context menu for a vocabulary row. */
export function VocabularyRowMenu({ vocabulary }: VocabularyRowActionsProps) {
  const common = useTranslations("common");
  return (
    <ContextMenuItem asChild>
      <Link href={vocabularyRoute({ id: vocabulary.id })}>
        <ExternalLinkIcon />
        {common("open")}
      </Link>
    </ContextMenuItem>
  );
}
