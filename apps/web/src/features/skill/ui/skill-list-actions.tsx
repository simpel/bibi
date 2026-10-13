import { Link } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/routes";
import { ImportSkillButton } from "./import-skill-button";

/** Header actions of the skills list: import a SKILL.md or create a skill. */
export async function SkillListActions() {
  const t = await getTranslations("skills");
  return (
    <>
      <ImportSkillButton />
      <Button asChild>
        <Link href={ROUTES.skillNew}>
          <PlusIcon />
          {t("create")}
        </Link>
      </Button>
    </>
  );
}
