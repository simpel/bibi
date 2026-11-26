"use client";

import {
  Button,
  Form,
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  toast,
} from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { DateField } from "@/components/date-picker/date-field";
import { TextField } from "@/components/form/text-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useLiveQuery } from "@/lib/use-live-query";
import { zodMessageMap } from "@/lib/zod-error-map";
import { availabilityAction, createReservationAction, reservationStateAction } from "../actions";
import {
  type NeedOption,
  type ReservationFormOutput,
  type ReservationFormValues,
  type ReservationInitial,
  reservationDefaults,
  reservationFormSchema,
} from "../lib/create-form";
import type { TableChoice } from "../lib/table-choice";
import { CreateReservationSlots, type SlotChoice } from "./create-reservation-slots";
import { NeedsEditor } from "./needs-editor";
import { TableChips } from "./table-chips";

export type CreateReservationSheetProps = {
  roomItemId: string;
  date: string;
  /** Tables of the layout each sitting uses, for choosing by hand. */
  tablesByService: Readonly<Record<string, readonly TableChoice[]>>;
  needOptions: readonly NeedOption[];
  /** Started from a table on the floor: its table, time and people are filled in. */
  initial?: ReservationInitial | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormProps = Omit<CreateReservationSheetProps, "open">;

function CreateReservationForm({
  roomItemId,
  date,
  tablesByService,
  needOptions,
  initial,
  onOpenChange,
}: FormProps) {
  const t = useTranslations("reservation.create");
  const warnings = useTranslations("reservation.warning");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();
  const form = useForm<ReservationFormValues, unknown, ReservationFormOutput>({
    mode: "onBlur",
    resolver: zodResolver(reservationFormSchema, {
      error: zodMessageMap({ translate: (key) => errors(key) }),
    }),
    defaultValues: reservationDefaults({ roomItemId, date, initial }),
  });
  const [day, party, startsAt] = form.watch(["date", "partySize", "startsAt"]);
  const size = Number(party);
  const availability = useLiveQuery({
    input:
      day && Number.isInteger(size) && size > 0 ? { roomItemId, date: day, partySize: size } : null,
    load: availabilityAction,
    waitMs: 300,
  });
  const ready = availability.status === "ready" ? availability.value : null;
  const slot = ready?.slots.find((one) => new Date(one.startsAt).toISOString() === startsAt);
  const tables = slot ? (tablesByService[slot.serviceId] ?? []) : [];
  const choose = ({ next }: { next: SlotChoice }) => {
    form.setValue("startsAt", new Date(next.startsAt).toISOString(), { shouldValidate: true });
    form.setValue("tableIds", []);
  };
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createReservationAction({ input: values }),
    messages: { pending: common("saving"), success: t("created") },
    onSuccess: ({ value }) => {
      // Walk-ins are at the table already: seat them as soon as the booking exists.
      if (initial)
        void reservationStateAction({ id: value.id, action: "seat" }).then(() => router.refresh());
      if (value.warnings.length > 0)
        toast.warning(value.warnings.map((warning) => warnings(warning)).join(" · "));
      router.refresh();
      onOpenChange(false);
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-5 px-4 pb-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <DateField form={form} name="date" label={t("date")} required />
          <TextField form={form} name="partySize" label={t("party")} type="number" required />
        </div>
        <FormController
          control={form.control}
          name="startsAt"
          render={() => (
            <FormItem>
              <FormLabel>{t("time")}</FormLabel>
              <FormControl>
                <div>
                  <CreateReservationSlots
                    state={availability}
                    chosen={startsAt}
                    onChoose={(next) => choose({ next })}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {tables.length > 0 ? (
          <TableChips
            label={t("tables")}
            hint={t("tablesHint")}
            tables={tables}
            value={form.watch("tableIds")}
            onChange={(ids) => form.setValue("tableIds", ids, { shouldDirty: true })}
          />
        ) : null}
        <TextField form={form} name="bookerName" label={t("name")} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField form={form} name="bookerPhone" label={t("phone")} type="tel" />
          <TextField form={form} name="bookerEmail" label={t("email")} type="email" />
        </div>
        <TextField form={form} name="note" label={t("note")} multiline rows={2} />
        <NeedsEditor
          options={needOptions}
          value={form.watch("requirements")}
          onChange={(rows) => form.setValue("requirements", rows, { shouldDirty: true })}
        />
        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {t("submit")}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}

/** Take a booking by phone or at the door: pick a time from what is free, then the booker. */
export function CreateReservationSheet({
  open,
  onOpenChange,
  ...rest
}: CreateReservationSheetProps) {
  const t = useTranslations("reservation.create");
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>
        {open ? <CreateReservationForm {...rest} onOpenChange={onOpenChange} /> : null}
      </SheetContent>
    </Sheet>
  );
}
