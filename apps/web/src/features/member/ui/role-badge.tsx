import type { FixedRole } from "@bibi/core/schemas";
import { Badge } from "@bibi/ui";
import { useTranslations } from "next-intl";

export type RoleBadgeProps = { role: FixedRole | null };

/** A member's or invitation's fixed role (ADR 0034); admins are outlined. */
export function RoleBadge({ role }: RoleBadgeProps) {
  const t = useTranslations("role");
  return <Badge variant={role === "admin" ? "outline" : "secondary"}>{t(role ?? "unknown")}</Badge>;
}
