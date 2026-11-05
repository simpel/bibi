import type { EntityTypeDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { CheckField } from "@/components/form/check-field";
import { TextField } from "@/components/form/text-field";
import { rawFields } from "@/components/typed-fields/raw-fields";
import { TypeFields } from "@/components/typed-fields/type-fields";
import { TypeSelectField } from "@/components/typed-fields/type-select-field";
import type { IntakeCatalog } from "./catalog";
import type { ReviewForm } from "./use-review-form";

export type OrderTypeFieldsProps = {
  form: ReviewForm;
  catalog: IntakeCatalog;
  type: EntityTypeDto | undefined;
  /** A custom booking chooses its type; a package's is fixed. */
  custom: boolean;
};

/**
 * The order type, asked only for a custom booking when the organization has several, and the
 * type's required own fields (spec "Build the booking").
 */
export function OrderTypeFields({ form, catalog, type, custom }: OrderTypeFieldsProps) {
  const t = useTranslations("orderIntake.review");
  const required = type ? { ...type, fields: type.fields.filter((field) => field.required) } : null;
  const choose = custom && catalog.orderTypes.length > 1;
  if (!choose && !required?.fields.length) return null;
  return (
    <div className="grid items-start gap-4 sm:grid-cols-2">
      {choose ? (
        <TypeSelectField
          control={form.control}
          types={catalog.orderTypes}
          label={t("orderType")}
          onTypeChange={(id) => {
            const next = catalog.orderTypes.find((each) => each.id === id);
            form.setValue("fields", rawFields({ type: next, stored: {} }));
          }}
        />
      ) : null}
      {required ? <TypeFields control={form.control} type={required} data={catalog} /> : null}
    </div>
  );
}

/** The order's title; left empty, one is suggested after the order is created. */
export function OrderTitleField({ form }: { form: ReviewForm }) {
  const t = useTranslations("order.fields");
  return (
    <TextField form={form} name="title" label={t("title")} placeholder={t("titlePlaceholder")} />
  );
}

/** Notes on the booking: `Order.note`, shown on the order and its run sheets. */
export function BookingNoteField({ form }: { form: ReviewForm }) {
  const t = useTranslations("orderIntake.review");
  return <TextField form={form} name="note" label={t("note")} multiline rows={3} />;
}

/** One-off only: also save these lines as a package, with a name. */
export function SavePackageFields({ form }: { form: ReviewForm }) {
  const t = useTranslations("orderIntake.review");
  const saving = form.watch("saveAsPackage");
  return (
    <div className="grid gap-3">
      <CheckField form={form} name="saveAsPackage" label={t("saveAsPackage")} />
      {saving ? <TextField form={form} name="packageName" label={t("packageName")} /> : null}
    </div>
  );
}
