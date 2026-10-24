import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

/** Link to the create-status page. */
export async function CreateTicketStatusButton() {
  const t = await getTranslations("ticketStatus");
  return (
    <Button asChild>
      <Link href={ROUTES.ticketStatusNew}>
        <PlusIcon />
        {t("create")}
      </Link>
    </Button>
  );
}
