"use client";

import { Badge, CardHeader, CardTitle } from "@bibi/ui";
import { ShieldCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ApprovalOperation } from "./approval-operation";

export type ApprovalHeaderProps = {
  operation: string;
  summary: string;
  /** A configuration change, which only admins and owners may confirm (ADR 0048). */
  needsAdmin?: boolean;
};

/** Card title, the operation and the human-readable summary of what would happen. */
export function ApprovalHeader({ operation, summary, needsAdmin = false }: ApprovalHeaderProps) {
  const t = useTranslations("assistant.approval");
  return (
    <CardHeader className="gap-2 p-4 pb-2">
      <div className="flex items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 font-sans text-sm font-semibold">
          <ShieldCheckIcon className="size-4 text-primary" />
          {t("title")}
        </CardTitle>
        <div className="flex items-center gap-1.5">
          {needsAdmin ? <Badge variant="outline">{t("needsAdmin")}</Badge> : null}
          <ApprovalOperation operation={operation} />
        </div>
      </div>
      <p className="text-sm font-medium">{summary}</p>
    </CardHeader>
  );
}
