import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Link } from "@/lib/navigation";
import { assignmentSubjectHref } from "./assignment-subject";
import type { GenerativeProps } from "./generative-props";

export type AssignmentCardRow = GenerativeProps<"assignment-table">["items"][number];

/** Subject (links to its page) · assignee · number of followers. */
export function useAssignmentCardColumns(): ColumnDef<AssignmentCardRow>[] {
  const t = useTranslations("assistant.ui.assignment");
  return useMemo(
    () => [
      {
        id: "subject",
        header: t("columns.subject"),
        accessorFn: (a) => t(`subject.${a.subjectType}`),
        cell: ({ row }) => (
          <Link
            href={assignmentSubjectHref({ assignment: row.original })}
            className="font-medium hover:underline"
          >
            {t(`subject.${row.original.subjectType}`)}
          </Link>
        ),
      },
      {
        id: "assignee",
        header: t("columns.assignee"),
        accessorFn: (a) => (a.assigneeId ? t("assigned") : t("unassigned")),
      },
      {
        id: "followers",
        header: t("columns.followers"),
        accessorFn: (a) => a.followers.length,
      },
    ],
    [t],
  );
}
