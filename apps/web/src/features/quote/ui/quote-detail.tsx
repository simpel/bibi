import type { Locale } from "@bibi/i18n";
import { Link } from "@bibi/i18n/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { nameOf } from "@/components/form/named-option";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { FactList } from "@/components/typed-fields/fact-list";
import { ticketRoute } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadQuotePage } from "../load-quote-page";
import { QuoteActions } from "./quote-actions";
import { QuoteDraftHint } from "./quote-draft-hint";
import { QuoteDrift } from "./quote-drift";
import { QuoteLinesTable } from "./quote-lines-table";
import { QuoteStatusBadge } from "./quote-status-badge";
import { QuoteTotals } from "./quote-totals";
import { QuoteVersions } from "./quote-versions";

export type QuoteDetailProps = { locale: Locale; id: string };

/**
 * Quote page body, for review and send (ADR 0052): status, validity, terms, the lines with change
 * markers (a DRAFT's are the ticket's lines, edited there), totals, how the ticket differs from an
 * accepted quote, and the versions.
 */
export async function QuoteDetail({ locale, id }: QuoteDetailProps) {
  const t = await getTranslations("quote");
  const format = await getFormatter();
  const page = await loadQuotePage({ id });
  if (!page.ok) return <ErrorState errorKey={handleLoadError({ error: page.error, locale })} />;
  const { quote, versions, ownerId, members, can } = page.value;
  const validUntil = quote.validUntil;
  const facts = [
    {
      label: t("fields.validUntil"),
      value: validUntil ? format.dateTime(validUntil, { dateStyle: "medium" }) : "–",
    },
    { label: t("fields.salesOwner"), value: nameOf({ options: members, id: ownerId }) },
    { label: t("fields.terms"), value: quote.terms ?? "–" },
  ];
  return (
    <div className="grid gap-6">
      <Link
        href={ticketRoute({ id: quote.ticketId })}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {t("backToTicket")}
      </Link>
      <PageHeader
        title={t("title", { version: quote.version })}
        actions={<QuoteActions quote={quote} can={can} />}
      />
      <QuoteStatusBadge status={quote.quoteStatus} />
      <FactList facts={facts} />
      <QuoteDraftHint quote={quote} />
      <QuoteLinesTable lines={quote.lines} removedLines={quote.removedLines} />
      <QuoteTotals quote={quote} />
      <QuoteDrift quote={quote} />
      {versions.length > 1 ? <QuoteVersions quotes={versions} currentId={quote.id} /> : null}
    </div>
  );
}
