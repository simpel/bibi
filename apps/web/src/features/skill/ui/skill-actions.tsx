"use client";

import { Button } from "@okazi/ui";
import { ArchiveIcon, SendIcon, Share2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { publishSkillAction, shareSkillAction } from "../actions";
import type { SkillAbilities } from "../skill-abilities";
import { ArchiveSkillDialog } from "./archive-skill-dialog";
import { EditSkillLink } from "./edit-skill-link";
import { ExportSkillButton } from "./export-skill-button";
import { SkillActionButton } from "./skill-action-button";

export type SkillActionsProps = {
  skill: { id: string; name: string };
  can: SkillAbilities;
};

/** Detail-page actions; only what the user may do is shown (the operations enforce it too). */
export function SkillActions({ skill, can }: SkillActionsProps) {
  const t = useTranslations("skills");
  const [archiving, setArchiving] = useState(false);
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
      {can.archive ? (
        <Button variant="outline" onClick={() => setArchiving(true)}>
          <ArchiveIcon />
          {t("archive")}
        </Button>
      ) : null}
      <ArchiveSkillDialog skill={skill} open={archiving} onOpenChange={setArchiving} />
    </>
  );
}
