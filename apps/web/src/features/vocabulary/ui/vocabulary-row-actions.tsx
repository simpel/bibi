"use client";

import type { VocabularyDto } from "@bibi/core";
import { ContextMenuItem, DataTableRowActions } from "@bibi/ui";
import { ExternalLinkIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { vocabularyRoute } from "@/lib/configuration-routes";
import { Link, useRouter } from "@/lib/navigation";
import { VocabularyDialog } from "./vocabulary-dialog";

export type VocabularyRowActionsProps = {
  vocabulary: VocabularyDto;
  access: RowAccess;
};

/** Rename (or Open) for one list; it is archived on its own page. */
export function VocabularyRowActions({ vocabulary, access }: VocabularyRowActionsProps) {
  const t = useTranslations("vocabulary");
  const common = useTranslations("common");
  const router = useRouter();
  const detail = vocabularyRoute({ id: vocabulary.id });
  const [editing, setEditing] = useState(false);
  const primary = access.canEdit
    ? [{ label: t("edit"), icon: PencilIcon, onClick: () => setEditing(true) }]
    : [{ label: common("open"), icon: ExternalLinkIcon, onClick: () => router.push(detail) }];
  return (
    <>
      <DataTableRowActions label={common("actions")} primary={primary} />
      <VocabularyDialog vocabulary={vocabulary} open={editing} onOpenChange={setEditing} />
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
