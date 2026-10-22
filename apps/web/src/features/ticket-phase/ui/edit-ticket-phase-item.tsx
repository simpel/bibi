import { DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";

export type EditTicketPhaseItemProps = { id: string };

/** The "Edit phase" menu item: a link to the update page. */
export function EditTicketPhaseItem({ id }: EditTicketPhaseItemProps) {
  const t = useTranslations("ticketPhase");
  const detail = listItemRoute({ list: ROUTES.settingsPipeline, id });
  return (
    <DropdownMenuItem asChild>
      <Link href={updateRoute({ detail })}>{t("edit")}</Link>
    </DropdownMenuItem>
  );
}
