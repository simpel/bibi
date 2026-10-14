"use client";

import { Link } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { skillRoute } from "@/lib/routes";

export type EditSkillLinkProps = { id: string };

export function EditSkillLink({ id }: EditSkillLinkProps) {
  const t = useTranslations("skills");
  return (
    <Button asChild variant="outline">
      <Link href={`${skillRoute({ id })}/edit`}>
        <PencilIcon />
        {t("edit")}
      </Link>
    </Button>
  );
}
