import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

/** Link to the step-by-step create page. */
export async function CreateTicketButton() {
  const t = await getTranslations("ticket");
  return (
    <Button asChild>
      <Link href={ROUTES.ticketNew}>
        <PlusIcon />
        {t("create")}
      </Link>
    </Button>
  );
}
