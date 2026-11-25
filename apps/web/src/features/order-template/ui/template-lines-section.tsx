import type { OrderTemplateDto } from "@bibi/core/schemas";
import { getTranslations } from "next-intl/server";
import { AddTemplateLineButton } from "./add-template-line-button";
import type { OrderTemplateFormData } from "./order-template-form-data";
import { TemplateLinesTable } from "./template-lines-table";

export type TemplateLinesSectionProps = {
  template: OrderTemplateDto;
  data: OrderTemplateFormData;
  canEdit: boolean;
};

/** The Lines tab: its title with Add line on the right, then the lines or an empty note. */
export async function TemplateLinesSection({ template, data, canEdit }: TemplateLinesSectionProps) {
  const t = await getTranslations("orderTemplate");
  return (
    <section className="grid grid-cols-1 gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl">{t("lines")}</h2>
        {canEdit ? <AddTemplateLineButton template={template} data={data} /> : null}
      </div>
      {template.lines.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("linesEmpty")}</p>
      ) : (
        <TemplateLinesTable template={template} data={data} canEdit={canEdit} />
      )}
    </section>
  );
}
