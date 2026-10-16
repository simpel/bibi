import type { OptionStatus } from "@okazi/core";
import { Badge } from "@okazi/ui";
import { useTranslations } from "next-intl";

export type OptionStatusBadgeProps = { status: OptionStatus; rank: number | null };

/** "1st option" style badge while active (rank 1 stands out), the final status otherwise. */
export function OptionStatusBadge({ status, rank }: OptionStatusBadgeProps) {
  const t = useTranslations("option");
  if (status === "ACTIVE" && rank !== null) {
    return <Badge variant={rank === 1 ? "default" : "secondary"}>{t("rank", { rank })}</Badge>;
  }
  return <Badge variant="outline">{t(`statuses.${status}`)}</Badge>;
}
