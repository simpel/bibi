import { Badge } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { MockupFrame } from "./mockup-frame";

const GROUPS = [
  { label: "types", items: ["type1", "type2", "type3"] },
  { label: "roles", items: ["role1", "role2", "role3"] },
  { label: "statuses", items: ["status1", "status2", "status3"] },
] as const;

export async function SetupMockup() {
  const t = await getTranslations("site.mockup.setup");
  return (
    <MockupFrame title={t("types")}>
      {GROUPS.map(({ label, items }) => (
        <div key={label} className="grid gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{t(label)}</span>
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <Badge key={item} variant="secondary">
                {t(item)}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </MockupFrame>
  );
}
