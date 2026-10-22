import { Link } from "@bibi/i18n/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/states/page-header";
import { getCallerAbilities } from "@/server/caller-abilities";
import { visibleSettings } from "./settings-items";

/** `/settings`: one card per configuration page (ADR 0036). Only areas the caller may view; each page checks again. */
export async function SettingsHub() {
  const t = await getTranslations("settingsHub");
  const nav = await getTranslations("nav");
  const { permissions } = await getCallerAbilities();
  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <ul className="grid gap-3 sm:grid-cols-2">
        {visibleSettings({ permissions }).map(({ href, key, icon: Icon }) => (
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
