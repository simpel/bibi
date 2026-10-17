"use client";

import type { SkillDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useSkillColumns } from "./use-skill-columns";

export type SkillTableProps = { skills: SkillDto[] };

export function SkillTable({ skills }: SkillTableProps) {
  const t = useTranslations("skills");
  const columns = useSkillColumns({ showVersion: true });
  return (
    <PersistedDataTable
      tableId="skill"
      columns={columns}
      data={skills}
      getRowId={(skill) => skill.id}
      emptyText={t("empty")}
    />
  );
}
