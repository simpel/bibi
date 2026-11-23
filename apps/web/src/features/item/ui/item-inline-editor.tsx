"use client";

import type { ItemDto } from "@bibi/core";
import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { TypeFields } from "@/components/typed-fields/type-fields";
import { CustomisationGroupsSection } from "./customisation-groups-section";
import { ItemVenueField } from "./item-core-fields";
import type { ItemFormData } from "./item-form-data";
import { ItemPictureField } from "./item-picture-field";
import type { ItemEditGroup } from "./item-update-input";
import { PartsSection } from "./parts-section";
import { PriceUnitField } from "./price-section";
import { useItemEdit } from "./use-item-edit";

export type ItemInlineEditorProps = {
  item: ItemDto;
  data: ItemFormData;
  /** The one part of the item this editor changes. */
  group: ItemEditGroup;
  /** The own field a `field` editor changes. */
  fieldKey?: string | undefined;
};

type GroupProps = ItemInlineEditorProps & { form: ReturnType<typeof useItemEdit>["form"] };

/** The fields of one group; the section around it already says what they are. */
function GroupFields({ item, data, group, fieldKey, form }: GroupProps) {
  const t = useTranslations("item.fields");
  const buffers = useTranslations("buffers");
  const items = useTranslations("item");
  const type = data.types.find(({ id }) => id === item.entityTypeId);
  const others = data.parts.filter(({ id }) => id !== item.id);
  switch (group) {
    case "picture":
      return <ItemPictureField form={form} />;
    case "price":
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <TextField form={form} name="price" label={t("price")} type="number" step="any" />
            <PriceUnitField control={form.control} />
          </div>
          <TextField form={form} name="vatRatePercent" label={t("vatRatePercent")} type="number" />
        </>
      );
    case "duration":
      return (
        <TextField
          form={form}
          name="defaultDurationMinutes"
          label={t("defaultDurationMinutes")}
          type="number"
        />
      );
    case "setup":
      return (
        <TextField form={form} name="setupMinutes" label={buffers("setupMinutes")} type="number" />
      );
    case "teardown":
      return (
        <TextField
          form={form}
          name="teardownMinutes"
          label={buffers("teardownMinutes")}
          type="number"
        />
      );
    case "layouts":
      // Label, input, then what the limit means: one field, no section heading.
      return (
        <div className="grid gap-2">
          <TextField
            form={form}
            name="maxPeople"
            label={items("maxPeople")}
            type="number"
            required
          />
          <p className="text-sm text-muted-foreground">{items("maxPeopleHint")}</p>
        </div>
      );
    case "parts":
      return <PartsSection form={form} parts={others} />;
    case "customisations":
      return <CustomisationGroupsSection form={form} items={others} />;
    case "description":
      return <TextField form={form} name="description" label={t("description")} multiline />;
    case "venue":
      return <ItemVenueField form={form} venues={data.venues} venuesHidden={data.venuesHidden} />;
    case "field":
      return type ? (
        <TypeFields control={form.control} type={type} data={data} only={fieldKey} />
      ) : null;
  }
}

/** Edits one part of an item in place (the picture's popover, a section), sending only that part. */
export function ItemInlineEditor(props: ItemInlineEditorProps) {
  const common = useTranslations("common");
  const { form, submit, pending, close } = useItemEdit({ ...props, groups: [props.group] });
  const compact =
    props.group === "description" || props.group === "venue" || props.group === "field";
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4 [&_legend]:sr-only">
        <GroupFields {...props} form={form} />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size={compact ? "sm" : "default"}
            onClick={close}
            disabled={pending}
          >
            {common("cancel")}
          </Button>
          <Button type="submit" size={compact ? "sm" : "default"} disabled={pending}>
            {common("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
