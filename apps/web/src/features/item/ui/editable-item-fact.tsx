import type { ItemDto } from "@bibi/core";
import { EditableFact } from "@/components/inline-edit/editable-fact";
import type { Fact } from "@/components/typed-fields/fact-list";
import type { ItemFormData } from "./item-form-data";
import { ItemInlineEditor } from "./item-inline-editor";
import type { ItemEditGroup } from "./item-update-input";

export type EditableItemFactInput = {
  fact: Fact;
  /** The pencil's label, e.g. "Edit Floor". */
  editLabel: string;
  group: ItemEditGroup;
  /** The own field a `field` fact edits. */
  fieldKey?: string | undefined;
  item: ItemDto;
  data: ItemFormData;
  canEdit: boolean;
};

/** A fact of the item page with its own pencil: a popover with just that setting. */
export function editableItemFact({
  fact,
  editLabel,
  group,
  fieldKey,
  item,
  data,
  canEdit,
}: EditableItemFactInput): Fact {
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
