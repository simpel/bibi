import { PageContainer } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { AssistantMockup } from "./mockups/assistant-mockup";
import { SiteSectionHeading } from "./site-section-heading";

/** The assistant: asks about tonight and proposes bookings, which staff approve. */
export async function SiteAssistant() {
  const t = await getTranslations("site.assistant");
  return (
    <section
      id="assistant"
      aria-labelledby="assistant-title"
      className="scroll-mt-20 border-y bg-muted/40 py-20 sm:py-28"
    >
      <PageContainer className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="grid gap-5">
          <SiteSectionHeading
            id="assistant-title"
            eyebrow={t("eyebrow")}
            title={t("title")}
            lead={t("lead")}
          />
          <p className="max-w-xl text-pretty text-muted-foreground">{t("mcp")}</p>
        </div>
        <AssistantMockup />
      </PageContainer>
    </section>
  );
}
