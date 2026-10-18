import { Link } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/routes";

/** Link to the step-by-step create page. */
export async function CreateSheetDefinitionButton() {
  const t = await getTranslations("sheetDefinition");
  return (
    <Button asChild>
      <Link href={ROUTES.sheetNew}>
        <PlusIcon />
        {t("create")}
      </Link>
    </Button>
  );
}
