import { PageContainer } from "@bibi/ui";
import { getTranslations } from "next-intl/server";

const INTEGRATIONS = [
  { name: "Stripe", key: "stripe" },
  { name: "Fortnox", key: "fortnox" },
  { name: "Spiris (Visma eEkonomi)", key: "visma" },
] as const;

/** Only integrations that exist today (ADR 0028, 0087, 0100). */
export async function SiteIntegrations() {
  const t = await getTranslations("site.integrations");
  return (
    <section id="integrations" className="scroll-mt-20 border-t py-20 sm:py-28">
      <PageContainer className="grid gap-10">
        <div className="grid max-w-2xl gap-3">
          <p className="text-sm text-muted-foreground">{t("eyebrow")}</p>
          <h2 className="text-balance text-4xl sm:text-5xl">{t("title")}</h2>
        </div>
        <ul className="grid gap-4 sm:grid-cols-3">
          {INTEGRATIONS.map(({ name, key }) => (
            <li key={key} className="grid gap-1 rounded-xl border bg-card p-6">
              <span className="font-serif text-3xl">{name}</span>
              <span className="text-muted-foreground">{t(key)}</span>
            </li>
          ))}
        </ul>
      </PageContainer>
    </section>
  );
}
