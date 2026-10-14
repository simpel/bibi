import type { SkillDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { skillRoute } from "@/lib/routes";
import { SkillBadges } from "./skill-badges";

export type SkillTableProps = { skills: SkillDto[] };

export async function SkillTable({ skills }: SkillTableProps) {
  const t = await getTranslations("skills");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.name")}</TableHead>
          <TableHead>{t("columns.scope")}</TableHead>
          <TableHead>{t("columns.version")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {skills.map((skill) => (
          <TableRow key={skill.id}>
            <TableCell>
              <Link href={skillRoute({ id: skill.id })} className="font-medium hover:underline">
                {skill.name}
              </Link>
              <p className="line-clamp-1 text-sm text-muted-foreground">{skill.description}</p>
            </TableCell>
            <TableCell>
              <SkillBadges scope={skill.scope} status={skill.status} />
            </TableCell>
            <TableCell>{skill.version}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
