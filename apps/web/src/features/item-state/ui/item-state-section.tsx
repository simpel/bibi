import { Link } from "@bibi/i18n/navigation";
import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { RowAccess } from "@/lib/can";
import { ROUTES } from "@/lib/routes";
import type { TypeStates } from "../load-item-state-data";
import { ItemStateTable } from "./item-state-table";

export type ItemStateSectionProps = TypeStates & { canCreate: boolean; access: RowAccess };

/** One item type: its name, a create link and the table of its states. */
export async function ItemStateSection({ type, states, canCreate, access }: ItemStateSectionProps) {
  const t = await getTranslations("itemState");
  return (
    <section className="grid gap-3" aria-label={type.name}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium">{type.name}</h2>
        {canCreate ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`${ROUTES.itemStateNew}?type=${encodeURIComponent(type.id)}`}>
              <PlusIcon />
              {t("create")}
            </Link>
          </Button>
        ) : null}
      </div>
      <ItemStateTable states={states} access={access} />
    </section>
  );
}
