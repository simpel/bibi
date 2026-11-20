"use client";

import type { ChangePreview } from "@bibi/core/schemas";
import { Button, Card } from "@bibi/ui";
import { CircleCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { createdRecord } from "../../../lib/created-record";

export type ApprovalDoneProps = { preview: ChangePreview | undefined; result: unknown };

/** A confirmed proposal: one line saying it is done and, for a new record, where to continue. */
export function ApprovalDone({ preview, result }: ApprovalDoneProps) {
  const t = useTranslations("assistant.approval.done");
  const { name, href, created } = createdRecord({ preview, result });
  const text = created ? (name ? t("created", { name }) : t("createdUnnamed")) : t("changed");
  return (
    <Card
      data-slot="approval-card"
      data-state="approved"
      className="flex-row flex-wrap items-center justify-between gap-3 p-4 shadow-none"
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        <CircleCheckIcon className="size-4 text-primary" />
        {text}
      </p>
      {href ? (
        <Button asChild size="sm">
          <Link href={href}>{t("continue")}</Link>
        </Button>
      ) : null}
    </Card>
  );
}
