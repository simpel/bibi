import { PageContainer } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { BookingPageMockup } from "./mockups/booking-page-mockup";
import { SiteSectionHeading } from "./site-section-heading";

const POINTS = ["manage", "mail", "embed"] as const;

/** The guest-facing part: the venue's own booking page, and what guests can do there. */
export async function SiteBookingPage() {
  const t = await getTranslations("site.bookingPage");
  return (
    <section
      id="booking-page"
      aria-labelledby="booking-page-title"
      className="scroll-mt-20 border-y bg-muted/40 py-20 sm:py-28"
    >
      <PageContainer className="grid items-start gap-12 lg:grid-cols-[5fr_6fr] lg:gap-16">
        <div className="mx-auto w-full max-w-sm lg:sticky lg:top-24">
          <BookingPageMockup />
        </div>
        <div className="grid gap-10">
          <SiteSectionHeading
            id="booking-page-title"
            eyebrow={t("eyebrow")}
            title={t("title")}
            lead={t("lead")}
          />
          <ul className="grid gap-6 sm:grid-cols-2">
            {POINTS.map((point) => (
              <li key={point} className="grid content-start gap-1.5 border-t pt-4">
                <h3 className="text-xl">{t(`points.${point}.title`)}</h3>
                <p className="text-muted-foreground">{t(`points.${point}.body`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </PageContainer>
    </section>
  );
}
