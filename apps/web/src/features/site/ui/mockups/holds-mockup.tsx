import { Badge } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { MockupFrame } from "./mockup-frame";

const ROWS = [
  { key: "room", state: "hard" },
  { key: "lunch", state: "soft" },
  { key: "tour", state: "none" },
] as const;

export async function HoldsMockup() {
  const t = await getTranslations("site.mockup.holds");
  return (
    <MockupFrame title={t("title")}>
      <ul className="grid divide-y rounded-lg border">
        {ROWS.map(({ key, state }) => (
          <li key={key} className="flex items-center justify-between px-3 py-3">
            <span>{t(key)}</span>
            <Badge
              variant={state === "none" ? "outline" : "secondary"}
              className={state === "hard" ? "bg-primary text-primary-foreground" : undefined}
            >
              {t(state)}
            </Badge>
          </li>
        ))}
      </ul>
    </MockupFrame>
  );
}
