import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { nameOf } from "@/components/form/named-option";
import { PersonName } from "@/components/people/person-name";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { FactList } from "@/components/typed-fields/fact-list";
import { quoteRoute } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadQuotePage, type QuotePageData } from "../load-quote-page";
import { QuoteBody } from "./quote-body";
import { QuoteStatusBadge } from "./quote-status-badge";

export type QuoteDetailProps = { locale: Locale; id: string };

type QuoteFactsInput = Pick<QuotePageData, "quote" | "ownerId" | "members"> & {
  t: Awaited<ReturnType<typeof getTranslations<"quote">>>;
};

/** The sales owner (opening their contact card) and the terms. */
function quoteFacts({ quote, ownerId, members, t }: QuoteFactsInput) {
  return [
    {
      label: t("fields.salesOwner"),
      value: nameOf({ options: members, id: ownerId }),
      node: <PersonName options={members} id={ownerId} description={t("fields.salesOwner")} />,
    },
    { label: t("fields.terms"), value: quote.terms ?? "–" },
  ];
}

/**
 * Quote page, for review and send (ADR 0052, 0116): one version with whether it is the current
 * one, its next step, lines and totals, and links to the other versions.
 */
export async function QuoteDetail({ locale, id }: QuoteDetailProps) {
  const [t, page] = await Promise.all([getTranslations("quote"), loadQuotePage({ id })]);
  if (!page.ok) return <ErrorState errorKey={handleLoadError({ error: page.error, locale })} />;
  const { quote, versions, ownerId, members, can } = page.value;
  return (
    <div className="grid gap-6">
      <CrumbName href={quoteRoute({ id })} name={t("title", { version: quote.version })} />
      <PageHeader
        title={t("title", { version: quote.version })}
        actions={<QuoteStatusBadge status={quote.quoteStatus} />}
      />
      <QuoteBody
        quote={quote}
        versions={versions}
        can={can}
        facts={<FactList facts={quoteFacts({ quote, ownerId, members, t })} />}
      />
    </div>
  );
}
