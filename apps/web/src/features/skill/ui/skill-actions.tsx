"use client";

import { SendIcon, Share2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { publishSkillAction, shareSkillAction } from "../actions";
import type { SkillAbilities } from "../skill-abilities";
import { EditSkillLink } from "./edit-skill-link";
import { ExportSkillButton } from "./export-skill-button";
import { SkillActionButton } from "./skill-action-button";

export type SkillActionsProps = {
  skill: { id: string; name: string };
  can: SkillAbilities;
};

/**
 * Detail-page actions; only what the user may do is shown (the operations enforce it too).
 * Archiving is in the page's danger area.
 */
export function SkillActions({ skill, can }: SkillActionsProps) {
  const t = useTranslations("skills");
  return (
    <>
      {can.edit ? <EditSkillLink id={skill.id} /> : null}
      {can.publish ? (
        <SkillActionButton
          icon={<SendIcon />}
          label={t("publish")}
          doneMessage={t("published")}
          run={() => publishSkillAction({ id: skill.id })}
        />
      ) : null}
      {can.share ? (
        <SkillActionButton
          icon={<Share2Icon />}
          label={t("share")}
          doneMessage={t("shared")}
          run={() => shareSkillAction({ id: skill.id })}
          openResult
        />
      ) : null}
      <ExportSkillButton id={skill.id} />
    </>
  );
}
