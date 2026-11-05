import { PageContainer } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { AssistantMockup } from "./mockups/assistant-mockup";
import { HoldsMockup } from "./mockups/holds-mockup";
import { NeedsMockup } from "./mockups/needs-mockup";
import { OrderMockup } from "./mockups/order-mockup";
import { RunSheetMockup } from "./mockups/run-sheet-mockup";
import { SetupMockup } from "./mockups/setup-mockup";
import { SiteFeatureBlock } from "./site-feature-block";

const BLOCKS = [
  { key: "orders", visual: <OrderMockup /> },
  { key: "needs", visual: <NeedsMockup /> },
  { key: "runSheets", visual: <RunSheetMockup /> },
  { key: "holds", visual: <HoldsMockup /> },
  { key: "setup", visual: <SetupMockup /> },
  { key: "assistant", visual: <AssistantMockup /> },
] as const;

/** What sets Bibi apart (CLAUDE.md "Differentiators"), one block per feature. */
export async function SiteFeatures() {
  const t = await getTranslations("site.features");
  return (
    <section id="features" className="scroll-mt-20 py-20 sm:py-28">
      <PageContainer className="grid gap-20 sm:gap-28">
        <div className="grid max-w-2xl gap-3">
          <p className="text-sm text-muted-foreground">{t("eyebrow")}</p>
          <h2 className="text-balance text-4xl sm:text-5xl">{t("title")}</h2>
        </div>
        {BLOCKS.map(({ key, visual }, index) => (
          <SiteFeatureBlock
            key={key}
            eyebrow={t(`${key}.eyebrow`)}
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
