import { PageContainer } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { SiteSectionHeading } from "./site-section-heading";

const PROVIDERS = [
  { name: "Fortnox", key: "fortnox" },
  { name: "Spiris (Visma eEkonomi)", key: "visma" },
  { name: "Swish", key: "swish" },
  { name: "Stripe", key: "stripe" },
] as const;

/** Payments and accounting: only providers that are built (ADR 0100, 0106, 0108). */
export async function SiteMoney() {
  const t = await getTranslations("site.money");
  return (
    <section id="money" aria-labelledby="money-title" className="scroll-mt-20 py-20 sm:py-28">
      <PageContainer className="grid gap-12">
        <SiteSectionHeading
          id="money-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          lead={t("lead")}
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROVIDERS.map(({ name, key }) => (
            <li key={key} className="grid content-start gap-1 rounded-xl border bg-card p-6">
              <span className="font-serif text-2xl">{name}</span>
              <span className="text-muted-foreground">{t(key)}</span>
            </li>
          ))}
        </ul>
        <p className="max-w-3xl text-pretty text-muted-foreground">{t("note")}</p>
      </PageContainer>
    </section>
  );
}
