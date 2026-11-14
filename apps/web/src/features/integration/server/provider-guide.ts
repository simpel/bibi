import "server-only";
import type { IntegrationProvider } from "@bibi/core/schemas";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import type { ProviderGuide } from "../ui/how-to-connect-button";

/** Each provider's own page on what a venue sets up before connecting (opened in a new tab). */
const GUIDE_URLS: Record<IntegrationProvider, string> = {
  STRIPE: "https://support.stripe.com/questions/know-your-customer-obligations",
  SWISH: "https://www.swish.nu/faq/company",
  FORTNOX: "https://www.fortnox.se/integrationer",
  VISMA: "https://www.spiris.se/integrationer",
};

/** `needs` is keyed "1", "2", …: the catalogue holds no arrays, and numeric keys keep their order. */
const guideSchema = z.object({
  title: z.string(),
  intro: z.string(),
  needs: z.record(z.string(), z.string()),
});

/** `raw` of a whole subtree is untyped in next-intl; Zod checks its shape instead. */
type RawTranslator = { raw(key: string): unknown };

export type LoadProviderGuideInput = { provider: IntegrationProvider; name: string };

/** The "How to connect" dialog's texts for one provider (`integration.guide`), as the user reads them. */
export async function loadProviderGuide({
  provider,
  name,
}: LoadProviderGuideInput): Promise<ProviderGuide> {
  const [t, common] = await Promise.all([
    getTranslations("integration.guide"),
    getTranslations("common"),
  ]);
  const text = guideSchema.parse((t as unknown as RawTranslator).raw(`providers.${provider}`));
  return {
    title: text.title,
    intro: text.intro,
    needs: Object.values(text.needs),
    buttonLabel: t("howToConnect"),
    heading: t("beforeYouStart"),
    url: GUIDE_URLS[provider],
    openLabel: t("openGuide", { name }),
    closeLabel: common("close"),
  };
}
