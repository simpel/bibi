import { useTranslations } from "next-intl";

/** Placeholder until the dashboard lands (ADR 0041). */
export function DashboardPage() {
  const t = useTranslations("dashboard");
  return (
    <div className="min-h-0 flex-1 overflow-auto p-6">
      <h1 className="font-serif text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
      <p className="mt-6 text-sm text-muted-foreground">{t("comingSoon")}</p>
    </div>
  );
}
