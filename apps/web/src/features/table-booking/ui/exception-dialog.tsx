"use client";

import {
  Button,
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
import { DateField } from "@/components/date-picker/date-field";
import { CheckField } from "@/components/form/check-field";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import { TimeField } from "@/components/form/time-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { zodMessageMap } from "@/lib/zod-error-map";
import { setExceptionAction } from "../actions";
import {
  type ExceptionFormOutput,
  type ExceptionFormValues,
  exceptionFormSchema,
  NEW_EXCEPTION,
} from "../lib/exception-form";
import type { LayoutOption } from "../lib/sitting-row";

export type SittingOption = { id: string; name: string };

export type ExceptionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sittings: readonly SittingOption[];
  layouts: readonly LayoutOption[];
  /** The exception being edited; none = a new one. */
  editing?: ExceptionFormValues | undefined;
};

type FormProps = Omit<ExceptionDialogProps, "open">;

function ExceptionForm({ onOpenChange, sittings, layouts, editing }: FormProps) {
  const t = useTranslations("tableBooking.exceptions");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();
  const form = useForm<ExceptionFormValues, unknown, ExceptionFormOutput>({
    resolver: zodResolver(exceptionFormSchema, {
      error: zodMessageMap({ translate: (key) => errors(key) }),
    }),
    defaultValues: editing ?? { ...NEW_EXCEPTION, serviceId: sittings[0]?.id ?? "" },
  });
  const closed = form.watch("closed");
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => setExceptionAction({ input: values }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: () => {
      router.refresh();
      onOpenChange(false);
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {editing ? null : (
          <>
            <OptionSelectField
              control={form.control}
              name="serviceId"
              label={t("sitting")}
              options={sittings}
            />
            <DateField form={form} name="date" label={t("date")} required />
          </>
        )}
        <CheckField form={form} name="closed" label={t("closed")} />
        {closed ? null : (
          <div className="grid gap-4 sm:grid-cols-2">
            <TimeField form={form} name="firstStart" label={t("firstStart")} />
            <TimeField form={form} name="lastStart" label={t("lastStart")} />
            <OptionSelectField
              control={form.control}
              name="layoutId"
              label={t("layout")}
              options={layouts}
              noneLabel={t("sittingsLayout")}
            />
            <TextField
              form={form}
              name="maxCoversPerSlot"
              label={t("maxCoversPerSlot")}
              type="number"
              placeholder={t("sittingsPace")}
            />
          </div>
        )}
        <TextField form={form} name="note" label={t("note")} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

/** Set one date's change to a sitting: closed, or other hours, layout or pace. */
export function ExceptionDialog({ open, onOpenChange, ...rest }: ExceptionDialogProps) {
  const t = useTranslations("tableBooking.exceptions");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rest.editing ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>
        {open ? (
          <ExceptionForm
            key={rest.editing ? `${rest.editing.serviceId}-${rest.editing.date}` : "new"}
            {...rest}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
