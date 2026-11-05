import { PageContainer } from "@bibi/ui";
import { getTranslations } from "next-intl/server";

const STEPS = ["create", "pay", "serve"] as const;

/** The three-step story, numbered. Anchor target for "How it works". */
export async function SiteSteps() {
  const t = await getTranslations("site.steps");
  return (
    <section id="how" className="scroll-mt-20 border-y bg-muted/40 py-20 sm:py-28">
      <PageContainer className="grid gap-12">
        <div className="grid max-w-2xl gap-3">
          <p className="text-sm text-muted-foreground">{t("eyebrow")}</p>
          <h2 className="text-balance text-4xl sm:text-5xl">{t("title")}</h2>
        </div>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step} className="grid content-start gap-3 rounded-xl border bg-card p-6">
              <span className="font-serif text-4xl tabular-nums text-primary">{index + 1}</span>
              <h3 className="text-2xl">{t(`${step}.title`)}</h3>
              <p className="text-muted-foreground">{t(`${step}.body`)}</p>
            </li>
          ))}
        </ol>
      </PageContainer>
    </section>
  );
}
