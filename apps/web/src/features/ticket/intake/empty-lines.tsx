import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { CatalogItem } from "./catalog";
import { QUICK_ADD_COUNT } from "./quick-line";

export type EmptyLinesProps = {
  items: CatalogItem[];
  onQuickAdd: (input: { item: CatalogItem }) => void;
};

/** "Nothing added yet" with quick-add buttons for the first items of the catalog. */
export function EmptyLines({ items, onQuickAdd }: EmptyLinesProps) {
  const t = useTranslations("ticketIntake.lines");
  const quick = items.slice(0, QUICK_ADD_COUNT);
  return (
    <div className="grid gap-3 rounded-lg border border-dashed p-4 text-sm">
      <p className="font-medium">{t("nothingYet")}</p>
      {quick.length > 0 ? (
        <>
          <p className="text-muted-foreground">{t("quickAdd")}</p>
          <div className="flex flex-wrap gap-2">
            {quick.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onQuickAdd({ item })}
              >
                {item.name}
              </Button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
