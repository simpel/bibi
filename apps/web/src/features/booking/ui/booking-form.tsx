import type { BookingDto } from "@okazi/core";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { rawFields } from "@/components/typed-fields/raw-fields";
import { TypeFields } from "@/components/typed-fields/type-fields";
import { TypeSelectField } from "@/components/typed-fields/type-select-field";
import { BookingCoreFields } from "./booking-core-fields";
import type { BookingFormData } from "./booking-form-data";
import { useBookingForm } from "./use-booking-form";

export type BookingFormProps = {
  data: BookingFormData;
  booking?: BookingDto | undefined;
  onDone: () => void;
};

/** Create (type picker first) or edit a booking: core fields, then the type's own fields. */
export function BookingForm({ data, booking, onDone }: BookingFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("booking.fields");
  const { form, submit, pending, typeOf } = useBookingForm({ data, booking, onDone });
  const type = typeOf({ id: form.watch("entityTypeId") });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {booking ? null : (
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
            <BookingCoreFields form={form} customers={data.customers} />
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
