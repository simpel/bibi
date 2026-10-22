import { Link } from "@bibi/i18n/navigation";
import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/routes";

/** Link to the step-by-step create page. */
export async function CreateCustomerButton() {
  const t = await getTranslations("customer");
  return (
    <Button asChild>
      <Link href={ROUTES.customerNew}>
        <PlusIcon />
        {t("create")}
      </Link>
    </Button>
  );
}
