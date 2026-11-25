"use client";

import type { OrderTemplateDto } from "@bibi/core/schemas";
import { HeaderActions, type TitleRowAction } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { templateOrderHref } from "../../order/intake/intake-slot";

export type TemplateHeaderActionsProps = {
  template: OrderTemplateDto;
  /** `order:write`: Create order with this template preselected. */
  canOrder: boolean;
};

/** The template page's action: Create order with it preselected (archiving: the danger tab). */
export function TemplateHeaderActions({ template, canOrder }: TemplateHeaderActionsProps) {
  const t = useTranslations("orderTemplate");
  const common = useTranslations("common");
  const router = useRouter();
  if (!canOrder) return null;
  const order: TitleRowAction = {
    id: "order",
    label: t("createOrder"),
    icon: <PlusIcon aria-hidden />,
    variant: "default",
    onSelect: () => router.push(templateOrderHref({ templateId: template.id })),
  };
  return <HeaderActions actions={[order]} moreLabel={common("actions")} foldBy="header" />;
}
