"use client";

import type { OrderTemplateDto } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { OrderTemplateFormData } from "./order-template-form-data";
import type { TemplateEditGroup } from "./template-edit-groups";
import {
  type TemplateFieldsProps,
  TemplateGuestFields,
  TemplateImageField,
  TemplateStatusField,
  TemplateTypeField,
} from "./template-fields";
import { useTemplateEdit } from "./use-template-edit";

export type TemplateInlineEditorProps = {
  template: OrderTemplateDto;
  data: OrderTemplateFormData;
  /** The one part of the template this editor changes. */
  group: Exclude<TemplateEditGroup, "lines">;
};

/** The fields of one group; the fact or picture around it already says what they are. */
function GroupFields({
  group,
  ...props
}: TemplateFieldsProps & Pick<TemplateInlineEditorProps, "group">) {
  switch (group) {
    case "picture":
      return <TemplateImageField form={props.form} />;
    case "guests":
      return <TemplateGuestFields form={props.form} />;
    case "type":
      return <TemplateTypeField {...props} />;
    case "status":
      return <TemplateStatusField {...props} />;
  }
}

/** Edits one part of a template in place (a fact's popover, the picture), sending only that part. */
export function TemplateInlineEditor({ template, data, group }: TemplateInlineEditorProps) {
  const common = useTranslations("common");
  const { form, submit, pending, close } = useTemplateEdit({ template, data, groups: [group] });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4 [&_legend]:sr-only">
        <GroupFields group={group} form={form} data={data} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={close} disabled={pending}>
            {common("cancel")}
          </Button>
          <Button type="submit" size="sm" disabled={pending}>
            {common("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
