"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { SkillBadges } from "@/features/skill/ui/skill-badges";
import { skillRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type SkillTableViewProps = GenerativeProps<"skill-table">;

/** A page of skills (name links to the skill page, with scope and status). */
export function SkillTableView({ items, nextCursor }: SkillTableViewProps) {
  const t = useTranslations("skills");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="skill-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.scope")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((skill) => (
            <TableRow key={skill.id}>
              <TableCell>
                <Link href={skillRoute({ id: skill.id })} className="font-medium hover:underline">
                  {skill.name}
                </Link>
                <p className="line-clamp-2 text-xs text-muted-foreground">{skill.description}</p>
              </TableCell>
              <TableCell>
                <SkillBadges scope={skill.scope} status={skill.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
