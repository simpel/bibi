import type { EntityTypeDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { CheckField } from "@/components/form/check-field";
import { TextField } from "@/components/form/text-field";
import { rawFields } from "@/components/typed-fields/raw-fields";
import { TypeFields } from "@/components/typed-fields/type-fields";
import { TypeSelectField } from "@/components/typed-fields/type-select-field";
import type { IntakeCatalog } from "./catalog";
import type { ReviewForm } from "./use-review-form";

export type TicketTypeFieldsProps = {
  form: ReviewForm;
  catalog: IntakeCatalog;
  type: EntityTypeDto | undefined;
  /** A one-off chooses its type; a package's is fixed. */
  oneOff: boolean;
};

/**
 * The ticket type, asked only for a one-off when the organization has several, and the type's
 * required own fields (spec "One-off only").
 */
export function TicketTypeFields({ form, catalog, type, oneOff }: TicketTypeFieldsProps) {
  const t = useTranslations("ticketIntake.review");
  const required = type ? { ...type, fields: type.fields.filter((field) => field.required) } : null;
  const choose = oneOff && catalog.ticketTypes.length > 1;
  if (!choose && !required?.fields.length) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {choose ? (
        <TypeSelectField
          control={form.control}
          types={catalog.ticketTypes}
          label={t("ticketType")}
          onTypeChange={(id) => {
            const next = catalog.ticketTypes.find((each) => each.id === id);
            form.setValue("fields", rawFields({ type: next, stored: {} }));
          }}
        />
      ) : null}
      {required ? <TypeFields control={form.control} type={required} data={catalog} /> : null}
    </div>
  );
}

/** Notes on the booking: `Ticket.note`, shown on the ticket and its sheets. */
export function BookingNoteField({ form }: { form: ReviewForm }) {
  const t = useTranslations("ticketIntake.review");
  return <TextField form={form} name="note" label={t("note")} multiline rows={3} />;
}

/** One-off only: also save these lines as a package, with a name. */
export function SavePackageFields({ form }: { form: ReviewForm }) {
  const t = useTranslations("ticketIntake.review");
  const saving = form.watch("saveAsPackage");
  return (
    <div className="grid gap-3">
      <CheckField form={form} name="saveAsPackage" label={t("saveAsPackage")} />
      {saving ? <TextField form={form} name="packageName" label={t("packageName")} /> : null}
    </div>
  );
}
