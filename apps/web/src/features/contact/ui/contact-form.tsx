import type { ContactDto } from "@okazi/core";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { rawFields } from "@/components/typed-fields/raw-fields";
import { TypeFields } from "@/components/typed-fields/type-fields";
import { TypeSelectField } from "@/components/typed-fields/type-select-field";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import { useContactForm } from "./use-contact-form";

export type ContactFormProps = {
  customerId: string;
  data: TypedFormData;
  contact?: ContactDto | undefined;
  onDone: () => void;
};

/** Create (type picker first) or edit a contact person: name, email, phone, own fields. */
export function ContactForm({ customerId, data, contact, onDone }: ContactFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("contact.fields");
  const { form, submit, pending, typeOf } = useContactForm({ customerId, data, contact, onDone });
  const type = typeOf({ id: form.watch("entityTypeId") });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {contact ? null : (
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
            <TextField form={form} name="name" label={t("name")} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField form={form} name="email" label={t("email")} type="email" />
              <TextField form={form} name="phone" label={t("phone")} type="tel" />
            </div>
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
