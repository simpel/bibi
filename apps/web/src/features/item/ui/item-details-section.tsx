import type { EntityTypeDto, ItemDto } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { EditableFact } from "@/components/inline-edit/editable-fact";
import { type Fact, FactList } from "@/components/typed-fields/fact-list";
import { itemFacts } from "./item-facts-list";
import type { ItemFormData } from "./item-form-data";
import { ItemInlineEditor } from "./item-inline-editor";
import type { ItemEditGroup } from "./item-update-input";

export type ItemDetailsSectionProps = {
  item: ItemDto;
  type: EntityTypeDto | undefined;
  data: ItemFormData;
  canEdit: boolean;
};

type EditableInput = {
  fact: Fact;
  editLabel: string;
  group: ItemEditGroup;
  fieldKey?: string;
} & ItemDetailsSectionProps;

/** A fact with its own pencil: a popover with just that field (like the order page's facts). */
function editable({ fact, editLabel, group, fieldKey, item, data, canEdit }: EditableInput): Fact {
  return {
    ...fact,
    node: (
      <EditableFact
        canEdit={canEdit}
        editLabel={editLabel}
        editor={<ItemInlineEditor item={item} data={data} group={group} fieldKey={fieldKey} />}
      >
        {fact.value}
      </EditableFact>
    ),
  };
}

/**
 * Description, type, venue and the type's own fields. Each fact but the type (fixed at create)
 * has its own pencil and saves only itself.
 */
export async function ItemDetailsSection(props: ItemDetailsSectionProps) {
  const { item, type, data } = props;
  const [t, page, common] = await Promise.all([
    getTranslations("item"),
    getTranslations("item.page"),
    getTranslations("common"),
  ]);
  const yesNo = { yes: common("yes"), no: common("no") };
  const [typeFact, venueFact, ...own] = itemFacts({
    ...{ item, type, data, t, yesNo },
    hidden: common("hidden"),
  });
  const description = { label: t("fields.description"), value: item.description ?? "–" };
  const facts = [
    editable({
      ...props,
      fact: description,
      editLabel: page("editFact", { label: description.label }),
      group: "description",
    }),
    ...(typeFact ? [typeFact] : []),
    ...(venueFact
      ? [
          editable({
            ...props,
            fact: venueFact,
            editLabel: page("editFact", { label: venueFact.label }),
            group: "venue",
          }),
        ]
      : []),
    ...own.map((fact, index) =>
      editable({
        ...props,
        fact,
        editLabel: page("editFact", { label: fact.label }),
        group: "field",
        fieldKey: type?.fields[index]?.key,
      }),
    ),
  ];
  return (
    <section className="grid grid-cols-1 gap-4">
      <h2 className="text-xl">{page("details")}</h2>
      <FactList facts={facts} />
    </section>
  );
}
