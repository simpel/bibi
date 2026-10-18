import { getInquiry } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { inquiryRoute } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadInquiryData } from "../load-inquiry-data";
import { InquiryUpdateForm } from "./inquiry-update-form";

export type InquiryUpdateProps = { locale: Locale; id: string };

/** `/inquiries/[id]/update`: edit the inquiry on a page of its own. */
export async function InquiryUpdate({ locale, id }: InquiryUpdateProps) {
  const t = await getTranslations("inquiry");
  if (!(await getCallerAbilities()).inquiryWrite) notFound();
  const [inquiry, data] = await Promise.all([
    runOperation({ operation: getInquiry, input: { id } }),
    loadInquiryData(),
  ]);
  if (!inquiry.ok)
    return <ErrorState errorKey={handleLoadError({ error: inquiry.error, locale })} />;
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  return (
    <FormPageShell
      backHref={inquiryRoute({ id })}
      title={t("edit")}
      description={t("editDescription")}
    >
      <InquiryUpdateForm inquiry={inquiry.value} data={data.value} />
    </FormPageShell>
  );
}
