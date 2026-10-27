import { Card, CardContent, CardHeader, CardTitle, PageContainer } from "@bibi/ui";
import { getTranslations } from "next-intl/server";

const FEATURES = ["tickets", "needs", "sheets", "setup"] as const;

/** What sets Bibi apart, in plain words (CLAUDE.md "Differentiators"). */
export async function SiteFeatures() {
  const t = await getTranslations("site.features");
  return (
    <PageContainer className="pb-20">
      <ul className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <li key={feature}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{t(`${feature}.title`)}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">{t(`${feature}.body`)}</CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
