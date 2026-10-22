import type { SkillDto } from "@bibi/core";
import { Link } from "@bibi/i18n/navigation";
import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { skillRoute } from "@/lib/routes";
import { scopeKey } from "@/lib/skill-labels";
import { SkillBadges } from "./skill-badges";

export type SkillRow = Pick<SkillDto, "id" | "name" | "description" | "scope"> &
  Partial<Pick<SkillDto, "status" | "version">>;

export type UseSkillColumnsInput = {
  /** Add the version column (not in assistant rows). */
  showVersion?: boolean;
};

/** Columns of the skill table, shared by the skills page and the assistant card. */
export function useSkillColumns({
  showVersion = false,
}: UseSkillColumnsInput): ColumnDef<SkillRow>[] {
  const t = useTranslations("skills");
  const versionColumn: ColumnDef<SkillRow>[] = showVersion
    ? [{ id: "version", header: t("columns.version"), accessorFn: (s) => s.version ?? 0 }]
    : [];
  return [
    {
      id: "name",
      header: t("columns.name"),
      accessorFn: (s) => s.name,
      cell: ({ row }) => (
        <>
          <Link href={skillRoute({ id: row.original.id })} className="font-medium hover:underline">
            {row.original.name}
          </Link>
          <p className="line-clamp-1 text-sm text-muted-foreground">{row.original.description}</p>
        </>
      ),
    },
    {
      id: "scope",
      header: t("columns.scope"),
      accessorFn: (s) => t(`scope.${scopeKey({ scope: s.scope })}`),
      cell: ({ row }) => <SkillBadges scope={row.original.scope} status={row.original.status} />,
    },
    ...versionColumn,
  ];
}
