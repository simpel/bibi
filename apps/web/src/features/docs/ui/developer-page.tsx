import { CrumbName } from "@/components/shell/crumb-name";
import { developerHref } from "../pages";
import { loadDocText } from "../server/doc-text";
import { DocArticle } from "./doc-article";

export type DeveloperPageProps = { locale: string; slug: string };

/** One developer page from i18n (`docs.pages.developers.<slug>`). */
export async function DeveloperPage({ locale, slug }: DeveloperPageProps) {
  const text = await loadDocText({ locale, namespace: "docs", key: `pages.developers.${slug}` });
  return (
    <>
      <CrumbName href={developerHref({ slug })} name={text.title} />
      <DocArticle title={text.title} lead={text.lead} markdown={text.body} />
    </>
  );
}
