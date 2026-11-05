import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

/** Link to the step-by-step create page. */
export async function CreateRunSheetDefinitionButton() {
  const t = await getTranslations("runSheetDefinition");
  return (
    <Button asChild>
      <Link href={ROUTES.runSheetNew}>
        <PlusIcon />
        {t("create")}
      </Link>
    </Button>
  );
}
