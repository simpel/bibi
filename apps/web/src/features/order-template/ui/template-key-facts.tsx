import type { OrderTemplateDto } from "@bibi/core/schemas";
import { KeyFacts } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { nameOf } from "@/components/form/named-option";
import { EditableFact } from "@/components/inline-edit/editable-fact";
import { guestRange } from "../lib/guest-range";
import type { OrderTemplateFormData } from "./order-template-form-data";
import type { TemplateEditGroup } from "./template-edit-groups";
import { TemplateInlineEditor } from "./template-inline-editor";

export type TemplateKeyFactsProps = {
  template: OrderTemplateDto;
  data: OrderTemplateFormData;
  canEdit: boolean;
};

type Fact = {
  group: Exclude<TemplateEditGroup, "lines" | "picture">;
  label: string;
  value: string;
};

/** Guests, booking type and start status under the title, each with its own pencil. */
export async function TemplateKeyFacts({ template, data, canEdit }: TemplateKeyFactsProps) {
  const t = await getTranslations("orderTemplate");
  const facts: Fact[] = [
    {
      group: "guests",
      label: t("columns.guests"),
      value: guestRange({ min: template.minGuests, max: template.maxGuests }),
    },
    {
      group: "type",
      label: t("columns.orderType"),
      value: nameOf({ options: data.orderTypes, id: template.entityTypeId }),
    },
    {
      group: "status",
      label: t("columns.status"),
      value: nameOf({ options: data.statuses, id: template.statusId }),
    },
  ];
  return (
    <KeyFacts
      facts={facts.map((fact) => ({
        label: fact.label,
        value: (
          <EditableFact
            canEdit={canEdit}
            editLabel={t("page.editFact", { label: fact.label })}
            editor={<TemplateInlineEditor template={template} data={data} group={fact.group} />}
          >
            {fact.value}
          </EditableFact>
        ),
      }))}
    />
  );
}
