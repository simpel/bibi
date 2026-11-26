import { getTranslations } from "next-intl/server";
import { MockupFrame } from "./mockup-frame";

/** Sales tries to book the dining room whole on an evening with table bookings, and is refused. */
export async function ConflictMockup() {
  const t = await getTranslations("site.mockup.conflict");
  return (
    <MockupFrame title={t("title")}>
      <div className="grid gap-0.5 rounded-lg border px-3 py-2.5">
        <span className="font-medium">{t("line")}</span>
        <span className="text-muted-foreground tabular-nums">{t("meta")}</span>
      </div>
      <div className="grid gap-0.5 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-destructive">
        <span className="font-medium">{t("error")}</span>
        <span className="text-destructive/90">{t("errorBody")}</span>
      </div>
      <p className="text-xs text-muted-foreground">{t("reverse")}</p>
    </MockupFrame>
  );
}
