"use client";

import { useTranslations } from "next-intl";
import { ArchiveDangerArea } from "@/components/danger-area/archive-danger-area";
import { ArchivedDangerArea } from "@/components/danger-area/archived-danger-area";
import { ROUTES } from "@/lib/routes";
import { ArchiveSkillDialog } from "./archive-skill-dialog";

export type SkillDangerAreaProps = { skill: { id: string; name: string; status: string } };

/** The skill's danger area, last on its page (shown when it may be archived). */
export function SkillDangerArea({ skill }: SkillDangerAreaProps) {
  const t = useTranslations("skills");
  if (skill.status === "ARCHIVED") {
    return <ArchivedDangerArea kind="skill" record={skill} listHref={ROUTES.skills} />;
  }
  return (
    <ArchiveDangerArea
      label={t("archive")}
      description={t("archiveConfirm", { name: skill.name })}
      dialog={(state) => <ArchiveSkillDialog skill={skill} {...state} />}
    />
  );
}
