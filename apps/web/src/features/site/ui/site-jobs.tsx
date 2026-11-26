import { PageContainer } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { FloorPlanMockup } from "./mockups/floor-plan-mockup";
import { OrderMockup } from "./mockups/order-mockup";
import { RunSheetMockup } from "./mockups/run-sheet-mockup";
import { SiteFeatureBlock } from "./site-feature-block";
import { SiteSectionHeading } from "./site-section-heading";

const JOBS = [
  { key: "meetings", visual: <OrderMockup /> },
  { key: "food", visual: <RunSheetMockup /> },
  { key: "restaurant", visual: <FloorPlanMockup /> },
] as const;

/** The three jobs a venue runs, one chapter each, numbered so the trio reads as one story. */
export async function SiteJobs() {
  const t = await getTranslations("site.jobs");
  return (
    <section id="jobs" aria-labelledby="jobs-title" className="scroll-mt-20 py-20 sm:py-28">
      <PageContainer className="grid gap-20 sm:gap-28">
        <SiteSectionHeading
          id="jobs-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          lead={t("lead")}
        />
        {JOBS.map(({ key, visual }, index) => (
          <SiteFeatureBlock
            key={key}
            id={key}
            eyebrow={t("chapter", { number: index + 1, name: t(`${key}.eyebrow`) })}
            title={t(`${key}.title`)}
            body={t(`${key}.body`)}
            visual={visual}
            flip={index % 2 === 1}
          />
        ))}
      </PageContainer>
    </section>
  );
}
