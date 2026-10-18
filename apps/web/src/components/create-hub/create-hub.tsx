import { Link } from "@okazi/i18n/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/states/page-header";
import { getCallerAbilities } from "@/server/caller-abilities";
import type { CreateGroup } from "./create-item-types";
import { creatableItems } from "./create-items";

const GROUPS: CreateGroup[] = ["work", "catalog", "settings"];

/** `/new`: every thing the caller can create, grouped, one card each. */
export async function CreateHub() {
  const t = await getTranslations("createHub");
  const items = creatableItems({ abilities: await getCallerAbilities() });
  return (
    <div className="grid gap-8">
      <PageHeader title={t("title")} description={t("description")} />
      {GROUPS.map((group) => {
        const inGroup = items.filter((item) => item.group === group);
        if (inGroup.length === 0) return null;
        return (
          <section key={group} className="grid gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">{t(`groups.${group}`)}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {inGroup.map(({ key, href, icon: Icon }) => (
                <li key={key}>
                  <Link href={href} className="block h-full rounded-lg focus-visible:outline-2">
                    <Card className="h-full transition-colors hover:bg-accent">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Icon className="size-4" />
                          {t(`items.${key}.title`)}
                        </CardTitle>
                        <CardDescription>{t(`items.${key}.description`)}</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
