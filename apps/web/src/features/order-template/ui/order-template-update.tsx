import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { loadOrderTemplate } from "@/features/order-template/load-order-template";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadOrderTemplateData } from "../load-order-template-data";
import { OrderTemplatePageForm } from "./order-template-page-form";

export type OrderTemplateUpdateProps = { locale: Locale; id: string };

/** `/admin/order-templates/[id]/update`: edit a predefined order on a page of its own. */
export async function OrderTemplateUpdate({ locale, id }: OrderTemplateUpdateProps) {
  const t = await getTranslations("orderTemplate");
  const [template, data] = await Promise.all([loadOrderTemplate({ id }), loadOrderTemplateData()]);
  const failed = !template.ok ? template : !data.ok ? data : null;
  if (failed) return <ErrorState errorKey={handleLoadError({ error: failed.error, locale })} />;
  if (!template.ok || !data.ok) return null;
  return (
    <>
      <CrumbName href={`/admin/order-templates/${id}/update`} name={template.value.name} />
      <FormPageShell
        backHref={ROUTES.adminOrderTemplates}
        title={t("edit")}
        description={t("editDescription")}
      >
        <OrderTemplatePageForm data={data.value} template={template.value} />
      </FormPageShell>
    </>
  );
}
