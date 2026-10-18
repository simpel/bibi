import { Link } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/routes";
import type { TypeStates } from "../load-item-state-data";
import { ItemStateTable } from "./item-state-table";

export type ItemStateSectionProps = TypeStates & { canAdmin: boolean };

/** One item type: its name, a create link and the table of its states. */
export async function ItemStateSection({ type, states, canAdmin }: ItemStateSectionProps) {
  const t = await getTranslations("itemState");
  return (
    <section className="grid gap-3" aria-label={type.name}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium">{type.name}</h2>
        {canAdmin ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`${ROUTES.itemStateNew}?type=${encodeURIComponent(type.id)}`}>
              <PlusIcon />
              {t("create")}
            </Link>
          </Button>
        ) : null}
      </div>
      <ItemStateTable states={states} canAdmin={canAdmin} />
    </section>
  );
}
