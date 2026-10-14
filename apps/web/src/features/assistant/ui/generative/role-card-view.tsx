"use client";

import { Link } from "@okazi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PermissionSummary } from "@/features/role/ui/permission-summary";
import { ROUTES } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type RoleCardViewProps = GenerativeProps<"role-card">;

/** One role: name, status and what it may do. */
export function RoleCardView({ role }: RoleCardViewProps) {
  const t = useTranslations("role");
  const common = useTranslations("common");
  return (
    <Card data-slot="role-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={ROUTES.settingsRoles} className="hover:underline">
            {role.name}
          </Link>
        </CardTitle>
        <Badge variant={role.status === "ARCHIVED" ? "outline" : "secondary"}>
          {role.system
            ? t("system")
            : role.status === "ARCHIVED"
              ? common("archived")
              : t("singular")}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-sm">
        <PermissionSummary permissions={role.permissions} all={role.system} />
      </CardContent>
    </Card>
  );
}
