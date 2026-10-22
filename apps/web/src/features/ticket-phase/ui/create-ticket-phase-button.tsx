import { Link } from "@bibi/i18n/navigation";
import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/routes";

/** Link to the create-phase page. */
export async function CreateTicketPhaseButton() {
  const t = await getTranslations("ticketPhase");
  return (
    <Button asChild>
      <Link href={ROUTES.ticketPhaseNew}>
        <PlusIcon />
        {t("create")}
      </Link>
    </Button>
  );
}
