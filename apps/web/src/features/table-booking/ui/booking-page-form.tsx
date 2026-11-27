"use client";

import type { BookingPageDto } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { zodMessageMap } from "@/lib/zod-error-map";
import { updateBookingPageAction } from "../actions";
import { BookingPageFields } from "./booking-page-fields";
import {
  type BookingPageFormOutput,
  type BookingPageFormValues,
  bookingPageDefaults,
  bookingPageFormSchema,
} from "./booking-page-form-schema";

export type BookingPageFormProps = {
  page: BookingPageDto;
  canEdit: boolean;
  /** The organization's active lists guests may count. */
  lists: { id: string; name: string }[];
};

/** The booking page's address, pictures, colour, texts and contact: saved together with Save. */
export function BookingPageForm({ page, canEdit, lists }: BookingPageFormProps) {
  const t = useTranslations("tableBooking.page");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();
  const form = useForm<BookingPageFormValues, unknown, BookingPageFormOutput>({
    mode: "onBlur",
    resolver: zodResolver(bookingPageFormSchema, {
      error: zodMessageMap({ translate: (key) => errors(key) }),
    }),
    defaultValues: bookingPageDefaults({ page }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => updateBookingPageAction({ input: values }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: () => router.refresh(),
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid max-w-2xl gap-6">
        <fieldset disabled={!canEdit} className="grid gap-6">
          <BookingPageFields form={form} lists={lists} />
        </fieldset>
        {canEdit ? (
          <div>
            <Button type="submit" disabled={pending || !form.formState.isDirty}>
              {common("save")}
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}
