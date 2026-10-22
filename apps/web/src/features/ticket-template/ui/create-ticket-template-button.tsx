import { Link } from "@bibi/i18n/navigation";
import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/routes";

/** Link to the create-predefined-ticket page. */
export async function CreateTicketTemplateButton() {
  const t = await getTranslations("ticketTemplate");
  return (
    <Button asChild>
      <Link href={ROUTES.ticketTemplateNew}>
        <PlusIcon />
        {t("create")}
      </Link>
    </Button>
  );
}
