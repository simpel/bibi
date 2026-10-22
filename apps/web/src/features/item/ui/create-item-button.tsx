import { Link } from "@bibi/i18n/navigation";
import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/routes";

export type CreateItemButtonProps = { typeId?: string | undefined };

/** Link to the step-by-step create page; the list's type filter pre-selects the type. */
export async function CreateItemButton({ typeId }: CreateItemButtonProps) {
  const t = await getTranslations("item");
  const href = typeId ? `${ROUTES.itemNew}?type=${encodeURIComponent(typeId)}` : ROUTES.itemNew;
  return (
    <Button asChild>
      <Link href={href}>
        <PlusIcon />
        {t("create")}
      </Link>
    </Button>
  );
}
