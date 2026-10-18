import { Link } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/routes";

/** Link to the step-by-step create page. */
export async function CreateBookingButton() {
  const t = await getTranslations("booking");
  return (
    <Button asChild>
      <Link href={ROUTES.bookingNew}>
        <PlusIcon />
        {t("create")}
      </Link>
    </Button>
  );
}
