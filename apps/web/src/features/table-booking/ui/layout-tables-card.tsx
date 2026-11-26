import { useTranslations } from "next-intl";
import type { LayoutTables } from "../lib/layout-tables";
import { CombinationsEditor } from "./combinations-editor";
import { TablesGrid } from "./tables-grid";

export type LayoutTablesCardProps = { layout: LayoutTables; canEdit: boolean };

/** One layout's tables (number, people range, online) and the combinations of them. */
export function LayoutTablesCard({ layout, canEdit }: LayoutTablesCardProps) {
  const t = useTranslations("tableBooking.tables");
  return (
    <section className="grid gap-4">
      <h3 className="text-lg">{layout.name}</h3>
      <TablesGrid layoutId={layout.layoutId} tables={layout.tables} canEdit={canEdit} />
      <div className="grid gap-3">
        <h4 className="text-sm font-medium">{t("combinations")}</h4>
        <CombinationsEditor
          layoutId={layout.layoutId}
          tables={layout.tables}
          combinations={layout.combinations}
          canEdit={canEdit}
        />
      </div>
    </section>
  );
}
