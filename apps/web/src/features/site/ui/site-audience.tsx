import { PageContainer } from "@bibi/ui";
import { getTranslations } from "next-intl/server";

const ITEMS = ["experience", "museum", "estate", "manor", "restaurant"] as const;

/** Who it is for, in place of a customer logo wall (there are no customers to show yet). */
export async function SiteAudience() {
  const t = await getTranslations("site.audience");
  return (
    <PageContainer className="grid gap-5 py-16 text-center">
      <p className="text-sm text-muted-foreground">{t("label")}</p>
      <ul className="flex flex-wrap justify-center gap-x-10 gap-y-3 font-serif text-xl text-foreground/70 sm:text-2xl">
        {ITEMS.map((item) => (
          <li key={item}>{t(`items.${item}`)}</li>
        ))}
      </ul>
    </PageContainer>
  );
}
