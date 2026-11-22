import type { OrderDto } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { EditableSection } from "@/components/inline-edit/editable-section";
import { FactList } from "@/components/typed-fields/fact-list";
import { ownFieldFacts } from "@/components/typed-fields/own-field-facts";
import { getDateTimeFormat } from "@/server/date-time-format";
import { getNumberFormat } from "@/server/number-format";
import { EMPTY, filled } from "./order-facts";
import type { OrderFormData } from "./order-form-data";
import type { OrderEditGroup } from "./order-form-schema";
import { OrderInlineEditor } from "./order-inline-editor";

/** The booking note as plain text; line breaks are kept. Renders nothing when unset. */
function OrderNote({ note, label }: { note: string | null; label: string }) {
  if (!note) return null;
  return (
    <div>
      <h3 className="text-sm text-muted-foreground">{label}</h3>
      <p className="mt-1 max-w-2xl whitespace-pre-line text-sm">{note}</p>
    </div>
  );
}

type ReferenceInput = {
  order: OrderDto;
  fields: Awaited<ReturnType<typeof getTranslations<"order.fields">>>;
};

/** The buyer's reference and where it comes from, or a warning when the customer requires one. */
function referenceValue({ order, fields }: ReferenceInput) {
  const reference = order.effectiveBuyerReference;
  if (reference === null) return fields("buyerReferenceMissing");
  return order.buyerReferenceSource === "CONTACT"
    ? fields("buyerReferenceFromContact", { reference })
    : reference;
}

export type OrderDetailsProps = {
  order: OrderDto;
  data: OrderFormData;
  /** May edit (`order:write`); a closed order edits only the buyer fields (`groups`). */
  canEdit: boolean;
  groups: readonly OrderEditGroup[];
};

/**
 * The rest of the order, lower on the page: type, money, holds, own fields and the note, edited
 * in place from the pencil beside the title. Left out when none is set and it cannot be edited.
 */
export async function OrderDetails({ order, data, canEdit, groups }: OrderDetailsProps) {
  const [t, fields, edit, common, kinds, format, { money }] = await Promise.all([
    getTranslations("order"),
    getTranslations("order.fields"),
    getTranslations("order.inlineEdit"),
    getTranslations("common"),
    getTranslations("customer.buyerKind"),
    getDateTimeFormat(),
    getNumberFormat(),
  ]);
  const type = data.types.find(({ id }) => id === order.entityTypeId);
  const kind = kinds(order.effectiveBuyerKind);
  const reference = order.effectiveBuyerReference;
  const amount = ({ minor }: { minor: number | null }) =>
    minor === null ? EMPTY : money({ minor });
  const facts = [
    { label: fields("type"), value: type?.name ?? EMPTY },
    {
      label: fields("buyerKind"),
      value: order.buyerKind ? kind : fields("buyerKindInherited", { kind }),
    },
    ...(reference || order.buyerReferenceMissing
      ? [{ label: fields("buyerReference"), value: referenceValue({ order, fields }) }]
      : []),
    ...(order.statusReason ? [{ label: fields("statusReason"), value: order.statusReason }] : []),
    { label: fields("budget"), value: amount({ minor: order.budgetMinor }) },
    { label: fields("estimatedValue"), value: amount({ minor: order.estimatedValueMinor }) },
    ...(order.holdsUntil
      ? [{ label: fields("holdsUntil"), value: format.dateTime({ instant: order.holdsUntil }) }]
      : []),
    ...ownFieldFacts({
      type,
      stored: order.fields,
      vocabularies: data.vocabularies,
      links: data.links,
      yesNo: { yes: common("yes"), no: common("no") },
    }),
  ];
  const shown = filled({ facts });
  if (shown.length === 0 && !order.note && !canEdit) return null;
  return (
    <EditableSection
      title={t("details")}
      editLabel={edit("details")}
      canEdit={canEdit}
      editor={<OrderInlineEditor order={order} data={Promise.resolve(data)} groups={groups} />}
    >
      <FactList facts={shown} />
      <OrderNote note={order.note} label={fields("note")} />
    </EditableSection>
  );
}
