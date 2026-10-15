import type { CustomerDto } from "@okazi/core";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { rawFields } from "@/components/typed-fields/raw-fields";
import { TypeFields } from "@/components/typed-fields/type-fields";
import { TypeSelectField } from "@/components/typed-fields/type-select-field";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import { CustomerCoreFields } from "./customer-core-fields";
import { useCustomerForm } from "./use-customer-form";

export type CustomerFormProps = {
  data: TypedFormData;
  customer?: CustomerDto | undefined;
  onDone: () => void;
};

/** Create (type picker first) or edit a customer: core fields, then the type's own fields. */
export function CustomerForm({ data, customer, onDone }: CustomerFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("customer.fields");
  const { form, submit, pending, typeOf } = useCustomerForm({ data, customer, onDone });
  const type = typeOf({ id: form.watch("entityTypeId") });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {customer ? null : (
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
            <CustomerCoreFields form={form} />
            <TypeFields control={form.control} type={type} vocabularies={data.vocabularies} />
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
