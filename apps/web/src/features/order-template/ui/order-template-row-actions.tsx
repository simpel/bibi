"use client";

import type { OrderTemplateDto } from "@bibi/core/schemas";
import { ContextMenuItem, DataTableRowActions } from "@bibi/ui";
import { ExternalLinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/lib/navigation";
import { orderTemplateHref } from "../template-route";

export type OrderTemplateRowActionsProps = { template: OrderTemplateDto };

/** Row action in the packages table: Open (edited in place and archived on its own page). */
export function OrderTemplateRowActions({ template }: OrderTemplateRowActionsProps) {
  const common = useTranslations("common");
  const router = useRouter();
  const detail = orderTemplateHref({ id: template.id });
  return (
    <DataTableRowActions
      label={common("actions")}
      primary={[
        { label: common("open"), icon: ExternalLinkIcon, onClick: () => router.push(detail) },
      ]}
    />
  );
}

/** Right-click menu for a package row. */
export function OrderTemplateRowMenu({ template }: OrderTemplateRowActionsProps) {
  const common = useTranslations("common");
  return (
    <ContextMenuItem asChild>
      <Link href={orderTemplateHref({ id: template.id })}>
        <ExternalLinkIcon />
        {common("open")}
      </Link>
    </ContextMenuItem>
  );
}
