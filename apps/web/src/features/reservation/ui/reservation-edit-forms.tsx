"use client";

import { Button, Form, toast } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { type FieldValues, type UseFormReturn, useForm } from "react-hook-form";
import { DateField } from "@/components/date-picker/date-field";
import { TextField } from "@/components/form/text-field";
import { TimeField } from "@/components/form/time-field";
import { useInlineEdit } from "@/components/inline-edit/inline-edit";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { zodMessageMap } from "@/lib/zod-error-map";
import { rescheduleReservationAction, updateReservationAction } from "../actions";
import type { NeedOption } from "../lib/create-form";
import type { TableChoice } from "../lib/table-choice";
import {
  type BookerOutput,
  type BookerValues,
  bookerFormSchema,
  type NeedsOutput,
  type NeedsValues,
  needsFormSchema,
  type WhenOutput,
  type WhenValues,
  whenFormSchema,
} from "../lib/update-forms";
import { NeedsEditor } from "./needs-editor";
import { TableChips } from "./table-chips";

function useErrorResolver() {
  const errors = useTranslations("errors");
  return { error: zodMessageMap({ translate: (key) => errors(key) }) };
}

type FrameProps<V extends FieldValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  submit: (event?: React.BaseSyntheticEvent) => void;
  pending: boolean;
  children: ReactNode;
};

/** A section's form: its fields, then Save and Cancel; Cancel closes the editor. */
function Frame<V extends FieldValues, O>({ form, submit, pending, children }: FrameProps<V, O>) {
  const common = useTranslations("common");
  const { close } = useInlineEdit();
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid max-w-xl gap-4">
        {children}
        <div className="flex gap-2">
          <Button type="submit" className="h-12 text-base" disabled={pending}>
            {common("save")}
          </Button>
          <Button type="button" variant="outline" className="h-12 text-base" onClick={close}>
            {common("cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export type WhenFormProps = {
  id: string;
  roomItemId: string;
  values: WhenValues;
  tables: readonly TableChoice[];
};

/** Date, time, party size, minutes at the table and tables; tables are re-found unless chosen. */
export function WhenForm({ id, roomItemId, values, tables }: WhenFormProps) {
  const t = useTranslations("reservation.detail");
  const common = useTranslations("common");
  const warnings = useTranslations("reservation.warning");
  const resolver = useErrorResolver();
  const router = useRouter();
  const { close } = useInlineEdit();
  const form = useForm<WhenValues, unknown, WhenOutput>({
    resolver: zodResolver(whenFormSchema, resolver),
    defaultValues: values,
  });
  const chosen = form.watch("tableIds");
  const changedTables =
    chosen.length !== values.tableIds.length ||
    chosen.some((one) => !values.tableIds.includes(one));
  const { submit, pending } = useFormAction({
    form,
    action: ({ values: input }) =>
      rescheduleReservationAction({
        ...{ id, roomItemId, ...input },
        tableIds: changedTables ? chosen : undefined,
      }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: ({ value }) => {
      if (value.warnings.length > 0)
        toast.warning(value.warnings.map((warning) => warnings(warning)).join(" · "));
      router.refresh();
      close();
    },
  });
  return (
    <Frame form={form} submit={submit} pending={pending}>
      <div className="grid gap-4 sm:grid-cols-2">
        <DateField form={form} name="date" label={t("date")} required />
        <TimeField form={form} name="time" label={t("time")} required />
        <TextField form={form} name="partySize" label={t("party")} type="number" required />
        <TextField
          form={form}
          name="durationMinutes"
          label={t("duration")}
          type="number"
          required
        />
      </div>
      <TableChips
        label={t("tables")}
        hint={t("tablesHint")}
        tables={tables}
        value={chosen}
        onChange={(ids) => form.setValue("tableIds", ids, { shouldDirty: true })}
      />
    </Frame>
  );
}

export type BookerFormProps = { id: string; values: BookerValues };

/** The one booker: name, phone, email and the message to the restaurant. */
export function BookerForm({ id, values }: BookerFormProps) {
  const t = useTranslations("reservation.detail");
  const common = useTranslations("common");
  const resolver = useErrorResolver();
  const router = useRouter();
  const { close } = useInlineEdit();
  const form = useForm<BookerValues, unknown, BookerOutput>({
    resolver: zodResolver(bookerFormSchema, resolver),
    defaultValues: values,
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values: input }) => updateReservationAction({ input: { id, ...input } }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: () => {
      router.refresh();
      close();
    },
  });
  return (
    <Frame form={form} submit={submit} pending={pending}>
      <TextField form={form} name="bookerName" label={t("name")} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="bookerPhone" label={t("phone")} type="tel" />
        <TextField form={form} name="bookerEmail" label={t("email")} type="email" />
      </div>
      <TextField form={form} name="note" label={t("note")} multiline rows={3} />
    </Frame>
  );
}

export type NeedsFormProps = { id: string; values: NeedsValues; options: readonly NeedOption[] };

/** Counts against the organization's lists. */
export function NeedsForm({ id, values, options }: NeedsFormProps) {
  const t = useTranslations("reservation.detail");
  const common = useTranslations("common");
  const resolver = useErrorResolver();
  const router = useRouter();
  const { close } = useInlineEdit();
  const form = useForm<NeedsValues, unknown, NeedsOutput>({
    resolver: zodResolver(needsFormSchema, resolver),
    defaultValues: values,
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values: input }) => updateReservationAction({ input: { id, ...input } }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: () => {
      router.refresh();
      close();
    },
  });
  return (
    <Frame form={form} submit={submit} pending={pending}>
      <NeedsEditor
        options={options}
        value={form.watch("requirements")}
        onChange={(rows) => form.setValue("requirements", rows, { shouldDirty: true })}
      />
    </Frame>
  );
}
