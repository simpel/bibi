import { Link } from "@bibi/i18n/navigation";
import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/routes";

/** Link to the step-by-step create page. */
export async function CreateResponsibilityButton() {
  const t = await getTranslations("responsibility");
  return (
    <Button asChild>
      <Link href={ROUTES.responsibilityNew}>
        <PlusIcon />
        {t("create")}
      </Link>
    </Button>
  );
}
