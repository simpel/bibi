"use client";

import { Button } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { skillRoute, updateRoute } from "@/lib/routes";

export type EditSkillLinkProps = { id: string };

export function EditSkillLink({ id }: EditSkillLinkProps) {
  const t = useTranslations("skills");
  return (
    <Button asChild variant="outline">
      <Link href={updateRoute({ detail: skillRoute({ id }) })}>
        <PencilIcon />
        {t("edit")}
      </Link>
    </Button>
  );
}
