"use client";

import { Badge } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { operationKey } from "../../../lib/approval-labels";

export type ApprovalOperationProps = { operation: string };

/** Human label of the operation (`venue.create` → "Create venue"), raw name as fallback. */
export function ApprovalOperation({ operation }: ApprovalOperationProps) {
  const t = useTranslations("assistant.approval");
  const key = operationKey({ operation });
  return (
    <Badge variant="outline" className="font-mono" title={operation}>
      {key ? t(`operations.${key}`) : operation}
    </Badge>
  );
}
