"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { RoleBadge } from "@/features/member/ui/role-badge";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type InvitationCardViewProps = GenerativeProps<"invitation-card">;

/** One invitation: email, status, the role it gives and when it expires. */
export function InvitationCardView({ invitation }: InvitationCardViewProps) {
  const t = useTranslations("member");
  const format = useDateTimeFormat();
  const expires = format.dateTime({ instant: invitation.expiresAt });
  return (
    <Card data-slot="invitation-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={ROUTES.adminMembers} className="hover:underline">
            {invitation.email}
          </Link>
        </CardTitle>
        <Badge variant={invitation.status === "pending" ? "secondary" : "outline"}>
          {t(`invitationStatus.${invitation.status}`)}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-2 p-4 pt-0 text-sm">
        <RoleBadge role={invitation.role} />
        <p className="text-muted-foreground">{t("expiresAt", { date: expires })}</p>
      </CardContent>
    </Card>
  );
}
