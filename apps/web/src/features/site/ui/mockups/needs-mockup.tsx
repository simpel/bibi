import { getTranslations } from "next-intl/server";
import { MockupFrame } from "./mockup-frame";

const NEEDS = [
  { key: "gluten", count: 3, width: "w-3/4" },
  { key: "lactose", count: 2, width: "w-1/2" },
  { key: "nuts", count: 1, width: "w-1/4" },
  { key: "vegan", count: 4, width: "w-full" },
] as const;

export async function NeedsMockup() {
  const t = await getTranslations("site.mockup.needs");
  return (
    <MockupFrame title={t("title")}>
      {NEEDS.map(({ key, count, width }) => (
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
      <p className="pt-1 text-xs text-muted-foreground">{t("matched")}</p>
    </MockupFrame>
  );
}
