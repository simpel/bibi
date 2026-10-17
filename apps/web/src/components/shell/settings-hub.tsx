import { Link } from "@okazi/i18n/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/states/page-header";
import { SETTINGS_ITEMS } from "./settings-items";

/** `/settings`: one card per configuration page (ADR 0036). Each page checks its own permission. */
export async function SettingsHub() {
  const t = await getTranslations("settingsHub");
  const nav = await getTranslations("nav");
  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <ul className="grid gap-3 sm:grid-cols-2">
        {SETTINGS_ITEMS.map(({ href, key, icon: Icon }) => (
          <li key={key}>
            <Link href={href} className="block h-full rounded-lg focus-visible:outline-2">
              <Card className="h-full transition-colors hover:bg-accent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="size-4" />
                    {nav(key)}
                  </CardTitle>
                  <CardDescription>{t(`items.${key}`)}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
