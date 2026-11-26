import { PageContainer } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { ConflictMockup } from "./mockups/conflict-mockup";
import { NeedsMockup } from "./mockups/needs-mockup";
import { SiteSectionHeading } from "./site-section-heading";

const TILES = [
  { key: "lists", visual: <NeedsMockup /> },
  { key: "blocking", visual: <ConflictMockup /> },
  { key: "floorPlans", visual: null },
  { key: "setup", visual: null },
] as const;

/** What the three jobs share: lists, rooms that block their tables, floor plans and the setup. */
export async function SiteShared() {
  const t = await getTranslations("site.shared");
  return (
    <section id="shared" aria-labelledby="shared-title" className="scroll-mt-20 py-20 sm:py-28">
      <PageContainer className="grid gap-12">
        <SiteSectionHeading
          id="shared-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          lead={t("lead")}
        />
        <ul className="grid gap-6 md:grid-cols-2">
          {TILES.map(({ key, visual }) => (
            <li
              key={key}
              className="grid content-start gap-5 rounded-2xl border bg-card p-6 sm:p-8"
            >
              <div className="grid gap-2">
                <h3 className="text-2xl">{t(`${key}.title`)}</h3>
                <p className="text-pretty text-muted-foreground">{t(`${key}.body`)}</p>
              </div>
              {visual}
            </li>
          ))}
        </ul>
      </PageContainer>
    </section>
  );
}
