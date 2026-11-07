import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import type { RowAccess } from "@/lib/can";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { TypeStates } from "../load-item-state-data";
import { ItemStateTable } from "./item-state-table";

export type ItemStateSectionProps = TypeStates & { canCreate: boolean; access: RowAccess };

/** One item type: its name, a create link and the table of its states. */
export async function ItemStateSection({ type, states, canCreate, access }: ItemStateSectionProps) {
  const t = await getTranslations("itemState");
  const create = canCreate ? (
    <Button asChild variant="outline" size="sm">
      <Link href={`${ROUTES.itemStateNew}?type=${encodeURIComponent(type.id)}`}>
        <PlusIcon />
        {t("create")}
      </Link>
    </Button>
  ) : undefined;
  return (
    <AdminSection title={type.name} action={create} flush>
      <ItemStateTable states={states} access={access} />
    </AdminSection>
  );
}
