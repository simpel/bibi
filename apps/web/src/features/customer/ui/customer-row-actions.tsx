"use client";

import { ContextMenuItem, DataTableRowActions } from "@bibi/ui";
import { ExternalLinkIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/lib/navigation";
import { customerRoute, updateRoute } from "@/lib/routes";
import type { CustomerRow } from "./use-customer-columns";

export type CustomerRowActionsProps = {
  customer: CustomerRow;
  canEdit?: boolean | undefined;
};

/** Row actions in the customers table: Edit (when allowed) or Open. */
export function CustomerRowActions({ customer, canEdit = false }: CustomerRowActionsProps) {
  const t = useTranslations("customer");
  const common = useTranslations("common");
  const router = useRouter();
  const detail = customerRoute({ id: customer.id });
  return (
    <DataTableRowActions
      label={common("actions")}
      primary={
        canEdit
          ? [
              {
                label: t("edit"),
                icon: PencilIcon,
                onClick: () => router.push(updateRoute({ detail })),
              },
            ]
          : [
              {
                label: common("open"),
                icon: ExternalLinkIcon,
                onClick: () => router.push(detail),
              },
            ]
      }
    />
  );
}

/** Right-click context menu for a customer row. */
export function CustomerRowMenu({ customer, canEdit = false }: CustomerRowActionsProps) {
  const t = useTranslations("customer");
  const common = useTranslations("common");
  const detail = customerRoute({ id: customer.id });
  return (
    <>
      <ContextMenuItem asChild>
        <Link href={detail}>
          <ExternalLinkIcon />
          {common("open")}
        </Link>
      </ContextMenuItem>
      {canEdit ? (
        <ContextMenuItem asChild>
          <Link href={updateRoute({ detail })}>
            <PencilIcon />
            {t("edit")}
          </Link>
        </ContextMenuItem>
      ) : null}
    </>
  );
}
