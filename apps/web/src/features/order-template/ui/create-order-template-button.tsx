import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

/** Link to the create-predefined-order page. */
export async function CreateOrderTemplateButton() {
  const t = await getTranslations("orderTemplate");
  return (
    <Button asChild>
      <Link href={ROUTES.orderTemplateNew}>
        <PlusIcon />
        {t("create")}
      </Link>
    </Button>
  );
}
