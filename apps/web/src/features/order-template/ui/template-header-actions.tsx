"use client";

import type { OrderTemplateDto } from "@bibi/core/schemas";
import { HeaderActions, type TitleRowAction } from "@bibi/ui";
import { ArchiveIcon, EllipsisIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { templateOrderHref } from "../../order/intake/intake-slot";
import { ArchiveOrderTemplateDialog } from "./archive-order-template-dialog";

export type TemplateHeaderActionsProps = {
  template: OrderTemplateDto;
  /** `order:write`: Create order with this template preselected. */
  canOrder: boolean;
  /** `orderTemplate:delete`. */
  canArchive: boolean;
};

/**
 * The template page's actions: Create order with it preselected, and Archive in the ⋯ menu,
 * confirmed in a dialog (archiving goes back to the list).
 */
export function TemplateHeaderActions({
  template,
  canOrder,
  canArchive,
}: TemplateHeaderActionsProps) {
  const t = useTranslations("orderTemplate");
  const common = useTranslations("common");
  const router = useRouter();
  const [archiving, setArchiving] = useState(false);
  const order: TitleRowAction = {
    id: "order",
    label: t("createOrder"),
    icon: <PlusIcon aria-hidden />,
    variant: "default",
    onSelect: () => router.push(templateOrderHref({ templateId: template.id })),
  };
  const more: TitleRowAction = {
    id: "more",
    label: common("actions"),
    icon: <EllipsisIcon aria-hidden />,
    variant: "outline",
    overflow: true,
    items: [
      {
        id: "archive",
        label: t("archive"),
        icon: <ArchiveIcon aria-hidden />,
        onSelect: () => setArchiving(true),
      },
    ],
  };
  const actions = [...(canOrder ? [order] : []), ...(canArchive ? [more] : [])];
  if (actions.length === 0) return null;
  return (
    <>
      <HeaderActions actions={actions} moreLabel={common("actions")} foldBy="header" />
      <ArchiveOrderTemplateDialog
        template={template}
        open={archiving}
        onOpenChange={setArchiving}
        onArchived={() => router.push(ROUTES.packages)}
      />
    </>
  );
}
