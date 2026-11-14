import {
  Button,
  type CalendarAsset,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
} from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TimeField } from "@/components/form/time-field";
import { slotHref } from "@/features/order/intake/intake-slot";
import { TimeOfDaySchema } from "@/features/order/intake/when-form-schema";
import { useRouter } from "@/lib/navigation";
import { plainDayText } from "@/lib/time/plain-day";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import { useZodMessages } from "@/lib/use-zod-messages";

/** A free slot drawn on the calendar: the resource, its plain day and wall times. */
export type PickedSlot = { asset: CalendarAsset; date: string; start: string; end: string };

export type SlotCreateDialogProps = {
  /** The slot drawn; null closes the dialog. */
  slot: PickedSlot | null;
  onClose: () => void;
  /** Ask the assistant to book the slot (the times as edited). */
  onAsk: (input: { slot: PickedSlot }) => void;
};

/** A `to` at or before `from` ends the next day, as in the intake; only an equal pair is refused. */
const SlotTimesSchema = z
  .object({ from: TimeOfDaySchema, to: TimeOfDaySchema })
  .refine(({ from, to }) => from !== to, { path: ["to"] });

type SlotTimes = z.infer<typeof SlotTimesSchema>;

function SlotForm({ slot, onClose, onAsk }: SlotCreateDialogProps & { slot: PickedSlot }) {
  const t = useTranslations("calendar.create");
  const common = useTranslations("common");
  const router = useRouter();
  const dates = useDateTimeFormat();
  const timeZone = useOrganizationTimeZone();
  const form = useForm<SlotTimes>({
    resolver: zodResolver(SlotTimesSchema, useZodMessages()),
    mode: "onTouched",
    defaultValues: { from: slot.start, to: slot.end },
  });
  const day = plainDayText({ day: slot.date, timeZone, dates });
  const create = form.handleSubmit(({ from, to }) =>
    router.push(slotHref({ slot: { itemId: slot.asset.id, date: slot.date, from, to } })),
  );
  const ask = form.handleSubmit(({ from, to }) =>
    onAsk({ slot: { ...slot, start: from, end: to } }),
  );
  return (
    <Form {...form}>
      <form onSubmit={create} noValidate className="grid gap-4">
        <DialogHeader>
          <DialogTitle>{slot.asset.name}</DialogTitle>
          <DialogDescription>{day}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 items-start gap-4">
          <TimeField form={form} name="from" label={t("from")} required />
          <TimeField form={form} name="to" label={t("to")} required />
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="ghost" onClick={ask}>
            {t("ask")}
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={onClose}>
              {common("cancel")}
            </Button>
            <Button type="submit">{t("createOrder")}</Button>
          </div>
        </DialogFooter>
      </form>
    </Form>
  );
}

/**
 * A free slot picked on the calendar (spec "Starting from the calendar"): the resource and day,
 * its times to adjust, Create order (the intake with the slot filled in) or Ask the assistant.
 */
export function SlotCreateDialog({ slot, onClose, onAsk }: SlotCreateDialogProps) {
  return (
    <Dialog open={slot !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="sm:max-w-md">
        {slot ? (
          <SlotForm
            key={`${slot.asset.id}.${slot.date}.${slot.start}`}
            {...{ slot, onClose, onAsk }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
