import { getTranslations } from "next-intl/server";
import { MockupFrame } from "./mockup-frame";

const LISTS = [
  {
    key: "diet",
    needs: [
      { key: "vegan", count: 4, width: "w-full" },
      { key: "vegetarian", count: 2, width: "w-1/2" },
    ],
  },
  {
    key: "allergens",
    needs: [
      { key: "gluten", count: 3, width: "w-3/4" },
      { key: "nuts", count: 1, width: "w-1/4" },
    ],
  },
] as const;

/** Needs as counts, grouped by the organization's own lists (allergens are one list of several). */
export async function NeedsMockup() {
  const t = await getTranslations("site.mockup.needs");
  return (
    <MockupFrame title={t("title")}>
      {LISTS.map((list) => (
        <div key={list.key} className="grid gap-2">
          <span className="text-xs text-muted-foreground">{t(`lists.${list.key}`)}</span>
          {list.needs.map(({ key, count, width }) => (
            <div key={key} className="grid gap-1.5">
              <div className="flex justify-between">
                <span>{t(key)}</span>
                <span className="tabular-nums text-muted-foreground">{count}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className={`h-2 rounded-full bg-primary ${width}`} />
              </div>
            </div>
          ))}
        </div>
      ))}
      <p className="pt-1 text-xs text-muted-foreground">{t("matched")}</p>
    </MockupFrame>
  );
}
