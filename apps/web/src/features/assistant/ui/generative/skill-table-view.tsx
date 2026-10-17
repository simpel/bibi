"use client";

import { Card } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useSkillColumns } from "@/features/skill/ui/use-skill-columns";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type SkillTableViewProps = GenerativeProps<"skill-table">;

/** A page of skills (name links to the skill page, with scope and status). */
export function SkillTableView({ items, nextCursor }: SkillTableViewProps) {
  const t = useTranslations("skills");
  const columns = useSkillColumns({});
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="skill-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="skill"
        columns={columns}
        data={items}
        getRowId={(skill) => skill.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
