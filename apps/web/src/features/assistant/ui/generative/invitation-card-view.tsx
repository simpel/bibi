"use client";

import { Link } from "@okazi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { ROUTES } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type InvitationCardViewProps = GenerativeProps<"invitation-card">;

/** One invitation: email, status, the roles it gives and when it expires. */
export function InvitationCardView({ invitation }: InvitationCardViewProps) {
  const t = useTranslations("member");
  const format = useFormatter();
  const expires = format.dateTime(new Date(invitation.expiresAt), {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <Card data-slot="invitation-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={ROUTES.settingsMembers} className="hover:underline">
            {invitation.email}
          </Link>
        </CardTitle>
        <Badge variant={invitation.status === "pending" ? "secondary" : "outline"}>
          {t(`invitationStatus.${invitation.status}`)}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-2 p-4 pt-0 text-sm">
        <ul className="flex flex-wrap gap-1">
          {invitation.roles.map((role) => (
            <li key={role}>
              <Badge variant="secondary">{role}</Badge>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground">{t("expiresAt", { date: expires })}</p>
      </CardContent>
    </Card>
  );
}
