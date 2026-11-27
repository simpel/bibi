import { PageContainer } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { AssistantMockup } from "./mockups/assistant-mockup";
import { BookingPageMockup } from "./mockups/booking-page-mockup";
import { NeedsMockup } from "./mockups/needs-mockup";
import { OrderMockup } from "./mockups/order-mockup";
import { SiteFeatureBlock } from "./site-feature-block";

const FEATURES = [
  { key: "meetings", visual: <OrderMockup /> },
  {
    key: "restaurant",
    visual: (
      <div className="mx-auto max-w-sm">
        <BookingPageMockup />
      </div>
    ),
  },
  { key: "lists", visual: <NeedsMockup /> },
  { key: "assistant", visual: <AssistantMockup /> },
] as const;

/** The four main messages, one section each: a short headline, one line and one picture. */
export async function SiteFeatures() {
  const t = await getTranslations("site.features");
  return (
    <PageContainer className="grid gap-24 py-20 sm:gap-32 sm:py-28">
      {FEATURES.map(({ key, visual }, index) => (
        <SiteFeatureBlock
          key={key}
          id={key}
          eyebrow={t(`${key}.eyebrow`)}
          title={t(`${key}.title`)}
          body={t(`${key}.body`)}
          visual={visual}
          flip={index % 2 === 1}
        />
      ))}
    </PageContainer>
  );
}
