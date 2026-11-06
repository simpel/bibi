import "server-only";
import { GUIDE_PAGES, guideHref } from "@/features/docs/pages";
import { loadDocText } from "@/features/docs/server/doc-text";

export type LoadGuideLinksInput = { locale: string };

/** Every staff guide with its title and lead, for the `/support` sidebar and start page. */
export async function loadGuideLinks({ locale }: LoadGuideLinksInput) {
  return Promise.all(
    GUIDE_PAGES.map(async (slug) => {
      const text = await loadDocText({ locale, namespace: "support", key: `guides.${slug}` });
      return { href: guideHref({ slug }), title: text.title, lead: text.lead };
    }),
  );
}
