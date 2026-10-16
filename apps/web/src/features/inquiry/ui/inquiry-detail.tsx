import { canTransition, getInquiry } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { Link } from "@okazi/i18n/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { nameOf } from "@/components/form/named-option";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { InquiryQuotes } from "@/features/quote/ui/inquiry-quotes";
import { ROUTES } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadInquiryData } from "../load-inquiry-data";
import { InquiryActions } from "./inquiry-actions";
import { InquiryFacts } from "./inquiry-facts";
import { InquiryStatusBadge } from "./inquiry-status-badge";

export type InquiryDetailProps = { locale: Locale; id: string };

/** Inquiry detail page body: status, facts, quotes, and edit, owner and status commands. */
export async function InquiryDetail({ locale, id }: InquiryDetailProps) {
  const common = await getTranslations("common");
  const t = await getTranslations("inquiry");
  const { inquiryWrite } = await getCallerAbilities();
  const [inquiry, data] = await Promise.all([
    runOperation({ operation: getInquiry, input: { id } }),
    loadInquiryData(),
  ]);
  if (!inquiry.ok) {
    return <ErrorState errorKey={handleLoadError({ error: inquiry.error, locale })} />;
  }
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  const from = inquiry.value.inquiryStatus;
  const can = {
    qualify: canTransition({ from, to: "QUALIFIED" }),
    markLost: canTransition({ from, to: "LOST" }),
  };
  const actions = inquiryWrite ? (
    <InquiryActions inquiry={inquiry.value} data={data.value} can={can} />
  ) : undefined;
  const customer = nameOf({ options: data.value.customers, id: inquiry.value.customerId });
  return (
    <div className="grid gap-6">
      <Link
        href={ROUTES.inquiries}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {common("back")}
      </Link>
      <PageHeader title={t("title", { customer })} actions={actions} />
      <div>
        <InquiryStatusBadge status={inquiry.value.inquiryStatus} />
      </div>
      <InquiryFacts inquiry={inquiry.value} data={data.value} />
      <InquiryQuotes locale={locale} inquiry={inquiry.value} />
    </div>
  );
}
