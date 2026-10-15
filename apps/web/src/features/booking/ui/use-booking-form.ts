import type { BookingDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useTypedResolver } from "@/components/typed-fields/use-typed-resolver";
import { bookingRoute } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { createBookingAction, updateBookingAction } from "../actions";
import type { BookingFormData } from "./booking-form-data";
import { type BookingFormOutput, bookingFormSchema, toBookingUpdate } from "./booking-form-schema";
import { type BookingFormValues, bookingFormDefaults } from "./booking-form-values";

export type UseBookingFormInput = {
  data: BookingFormData;
  /** Present = edit mode, absent = create mode. */
  booking?: BookingDto | undefined;
  onDone: () => void;
};

/** Booking form state; a new booking opens its page, an edit refreshes it. */
export function useBookingForm({ data, booking, onDone }: UseBookingFormInput) {
  const t = useTranslations("booking");
  const common = useTranslations("common");
  const router = useRouter();
  const typeOf = ({ id }: { id: string }) => data.types.find((type) => type.id === id);
  const resolver = useTypedResolver<BookingFormValues, BookingFormOutput>({
    types: data.types,
    schemaFor: ({ type }) => bookingFormSchema({ type, vocabularies: data.vocabularies }),
  });
  const initial = typeOf({ id: booking?.entityTypeId ?? data.types[0]?.id ?? "" });
  const form = useForm<BookingFormValues, unknown, BookingFormOutput>({
    resolver,
    defaultValues: bookingFormDefaults({ type: initial, booking }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      booking
        ? updateBookingAction({
            input: toBookingUpdate({ booking, values, type: typeOf({ id: booking.entityTypeId }) }),
          })
        : createBookingAction({ input: values }),
    messages: { pending: common("saving"), success: t(booking ? "updated" : "created") },
    onSuccess: ({ value }) => {
      onDone();
      if (booking) router.refresh();
      else router.push(bookingRoute({ id: value.id }));
    },
  });
  return { form, submit, pending, typeOf };
}
