import { Badge } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { MockupFrame } from "./mockup-frame";

const LINES = ["line1", "line2", "line3"] as const;

export async function RunSheetMockup() {
  const t = await getTranslations("site.mockup.runSheet");
  return (
    <MockupFrame title={t("title")}>
      <div className="flex items-center justify-between">
        <span className="font-serif text-lg">{t("title")}</span>
        <Badge variant="outline">{t("version")}</Badge>
      </div>
      <ul className="grid gap-2">
        {LINES.map((line) => (
          <li key={line} className="rounded-lg border px-3 py-2.5 tabular-nums">
            {t(line)}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{t("sentTo")}</p>
    </MockupFrame>
  );
}
