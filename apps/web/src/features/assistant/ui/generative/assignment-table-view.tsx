"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { assignmentSubjectHref } from "./assignment-subject";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type AssignmentTableViewProps = GenerativeProps<"assignment-table">;

/** Assignments of one subject, or the member's own; subjects link to their page. */
export function AssignmentTableView({ items, nextCursor }: AssignmentTableViewProps) {
  const t = useTranslations("assistant.ui.assignment");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="assignment-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.subject")}</TableHead>
            <TableHead>{t("columns.assignee")}</TableHead>
            <TableHead>{t("columns.followers")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((assignment) => (
            <TableRow key={assignment.id}>
              <TableCell className="font-medium">
                <Link href={assignmentSubjectHref({ assignment })} className="hover:underline">
                  {t(`subject.${assignment.subjectType}`)}
                </Link>
              </TableCell>
              <TableCell>{assignment.assigneeId ? t("assigned") : t("unassigned")}</TableCell>
              <TableCell>{assignment.followerIds.length}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
