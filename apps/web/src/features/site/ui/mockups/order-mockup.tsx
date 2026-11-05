import { Badge } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { MockupFrame } from "./mockup-frame";

const LINES = ["room", "lunch", "activity"] as const;

export async function OrderMockup() {
  const t = await getTranslations("site.mockup.order");
  return (
    <MockupFrame title={t("title")}>
      <div className="flex items-center justify-between">
        <span className="font-serif text-lg">{t("title")}</span>
        <Badge variant="secondary">{t("status")}</Badge>
      </div>
      <ul className="grid divide-y rounded-lg border">
        {LINES.map((line) => (
          <li key={line} className="flex items-center justify-between px-3 py-2.5">
            <span>{t(line)}</span>
            <span className="text-muted-foreground">{t("guests")}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-end justify-between pt-1">
        <span className="text-muted-foreground">{t("total")}</span>
        <span className="font-serif text-2xl tabular-nums">{t("amount")}</span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-accent px-3 py-2.5">
        <span>{t("payment")}</span>
        <Badge className="bg-success text-success-foreground">{t("paid")}</Badge>
      </div>
    </MockupFrame>
  );
}
