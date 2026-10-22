import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

/** Link to the step-by-step create page. */
export async function CreateVenueButton() {
  const t = await getTranslations("venue");
  return (
    <Button asChild>
      <Link href={ROUTES.venueNew}>
        <PlusIcon />
        {t("create")}
      </Link>
    </Button>
  );
}
