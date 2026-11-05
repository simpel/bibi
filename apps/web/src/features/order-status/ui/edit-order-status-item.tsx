import { DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";

export type EditOrderStatusItemProps = { id: string };

/** The "Edit status" menu item: a link to the update page. */
export function EditOrderStatusItem({ id }: EditOrderStatusItemProps) {
  const t = useTranslations("orderStatus");
  const detail = listItemRoute({ list: ROUTES.settingsPipeline, id });
  return (
    <DropdownMenuItem asChild>
      <Link href={updateRoute({ detail })}>{t("edit")}</Link>
    </DropdownMenuItem>
  );
}
