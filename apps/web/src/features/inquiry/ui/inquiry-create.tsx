import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadInquiryData } from "../load-inquiry-data";
import { InquiryWizard } from "./inquiry-wizard";

export type InquiryCreateProps = { locale: Locale };

/** `/new/inquiry`: the step-by-step create page. */
export async function InquiryCreate({ locale }: InquiryCreateProps) {
  const t = await getTranslations("inquiry");
  const data = await loadInquiryData();
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  return (
    <FormPageShell
      backHref={ROUTES.inquiries}
      title={t("create")}
      description={t("createDescription")}
    >
      <InquiryWizard data={data.value} />
    </FormPageShell>
  );
}
