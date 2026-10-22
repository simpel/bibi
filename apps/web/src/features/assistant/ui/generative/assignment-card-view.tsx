"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { assignmentSubjectHref } from "./assignment-subject";
import type { GenerativeProps } from "./generative-props";

export type AssignmentCardViewProps = GenerativeProps<"assignment-card">;

/** One assignment: its subject (link), whether someone is assigned and how many follow. */
export function AssignmentCardView({ assignment }: AssignmentCardViewProps) {
  const t = useTranslations("assistant.ui.assignment");
  const href = assignmentSubjectHref({ assignment });
  return (
    <Card data-slot="assignment-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={href} className="hover:underline">
            {t(`subject.${assignment.subjectType}`)}
          </Link>
        </CardTitle>
        <Badge variant="secondary">
          {assignment.responsibilityId ? t("responsibility") : t("main")}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>{assignment.assigneeId ? t("assigned") : t("unassigned")}</p>
        <p>{t("followers", { count: assignment.followers.length })}</p>
      </CardContent>
    </Card>
  );
}
