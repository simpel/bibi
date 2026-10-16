import type { InquiryDto } from "@okazi/core";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { rawFields } from "@/components/typed-fields/raw-fields";
import { TypeFields } from "@/components/typed-fields/type-fields";
import { TypeSelectField } from "@/components/typed-fields/type-select-field";
import { InquiryCoreFields } from "./inquiry-core-fields";
import type { InquiryFormData } from "./inquiry-form-data";
import { useInquiryForm } from "./use-inquiry-form";

export type InquiryFormProps = {
  data: InquiryFormData;
  inquiry?: InquiryDto | undefined;
  onDone: () => void;
};

/** Create (type picker first) or edit an inquiry: core fields, then the type's own fields. */
export function InquiryForm({ data, inquiry, onDone }: InquiryFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("inquiry.fields");
  const { form, submit, pending, typeOf } = useInquiryForm({ data, inquiry, onDone });
  const type = typeOf({ id: form.watch("entityTypeId") });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {inquiry ? null : (
          <TypeSelectField
            control={form.control}
            types={data.types}
            label={t("type")}
            onTypeChange={(id) =>
              form.setValue("fields", rawFields({ type: typeOf({ id }), stored: {} }))
            }
          />
        )}
        {type ? (
          <>
            <InquiryCoreFields form={form} customers={data.customers} contacts={data.contacts} />
            <TypeFields control={form.control} type={type} data={data} />
          </>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending || !type}>
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
