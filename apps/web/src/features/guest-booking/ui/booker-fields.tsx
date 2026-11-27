import type { UseFormReturn } from "react-hook-form";
import { PhoneField } from "@/components/form/phone-field";
import { TextField } from "@/components/form/text-field";

/** The booker's fields shared by booking and editing; values match core's booker input. */
export type BookerValues = {
  bookerName: string;
  bookerPhone: string;
  bookerEmail: string;
  note: string;
};

export type BookerFieldsProps<V extends BookerValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  labels: { name: string; phone: string; email: string; emailHint: string; note: string };
};

/** Name, phone and email (required) and an optional message. Inside `<Form {...form}>`. */
export function BookerFields<V extends BookerValues, O>({ form, labels }: BookerFieldsProps<V, O>) {
  const typed = form as unknown as UseFormReturn<BookerValues, unknown, O>;
  return (
    <>
      <TextField form={typed} name="bookerName" label={labels.name} autoComplete="name" required />
      <PhoneField form={typed} name="bookerPhone" label={labels.phone} required />
      <div className="flex flex-col gap-1.5">
        <TextField
          form={typed}
          name="bookerEmail"
          label={labels.email}
          type="email"
          autoComplete="email"
          required
        />
        <p className="text-xs text-muted-foreground">{labels.emailHint}</p>
      </div>
      <TextField form={typed} name="note" label={labels.note} multiline rows={3} />
    </>
  );
}
