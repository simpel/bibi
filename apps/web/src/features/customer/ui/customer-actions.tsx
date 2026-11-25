"use client";

import type { CustomerDto } from "@bibi/core";
import { Button } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { customerRoute, updateRoute } from "@/lib/routes";

export type CustomerActionsProps = { customer: CustomerDto };

/** Edit (its own page) on the customer detail page; archiving is in its danger area. */
export function CustomerActions({ customer }: CustomerActionsProps) {
  const t = useTranslations("customer");
  return (
    <Button asChild variant="outline">
      <Link href={updateRoute({ detail: customerRoute({ id: customer.id }) })}>
        <PencilIcon />
        {t("edit")}
      </Link>
    </Button>
  );
}
