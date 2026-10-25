"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { memberRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type MemberProfileCardViewProps = GenerativeProps<"member-profile-card">;

/** One member's work: schedule kind and linked staff items. The member page names positions. */
export function MemberProfileCardView({ profile }: MemberProfileCardViewProps) {
  const t = useTranslations("assistant.ui.memberProfile");
  const kinds = useTranslations("memberProfile.scheduleKinds");
  return (
    <Card data-slot="member-profile-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{t("singular")}</CardTitle>
        <Badge variant="secondary">{kinds(profile.scheduleKind)}</Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>
          {profile.items.length === 0
            ? t("noItems")
            : profile.items.map(({ name }) => name).join(", ")}
        </p>
        <Link href={memberRoute({ id: profile.memberId })} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
