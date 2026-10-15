import type { SeriesOccurrenceDto } from "@okazi/core";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { NamedOption } from "@/components/form/named-option";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { OccurrenceFormOutput, OccurrenceFormValues } from "./occurrence-form-schema";
import { useOccurrenceForm } from "./use-occurrence-form";

export type OccurrenceFormProps = {
  seriesId: string;
  occurrence: SeriesOccurrenceDto;
  rooms: readonly NamedOption[];
  onDone: () => void;
};

type OccurrenceChangeFieldsProps = {
  form: UseFormReturn<OccurrenceFormValues, unknown, OccurrenceFormOutput>;
  rooms: readonly NamedOption[];
};

/** The new start, length, room and headcount. */
function OccurrenceChangeFields({ form, rooms }: OccurrenceChangeFieldsProps) {
  const t = useTranslations("bookingSeries");
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name="patch.startsAt"
          label={t("fields.occurrenceStartsAt")}
          type="datetime-local"
        />
        <TextField
          form={form}
          name="patch.durationMinutes"
          label={t("fields.durationMinutes")}
          type="number"
        />
      </div>
      <OptionSelectField
        control={form.control}
        name="patch.itemId"
        label={t("fields.room")}
        options={rooms}
        noneLabel={t("fields.keepRoom")}
      />
      <TextField
        form={form}
        name="patch.estimatedHeadcount"
        label={t("fields.estimatedHeadcount")}
        type="number"
      />
    </>
  );
}

/** Scope (only this or this and following), then the new time, room and headcount. */
export function OccurrenceForm({ seriesId, occurrence, rooms, onDone }: OccurrenceFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("bookingSeries");
  const { form, submit, pending } = useOccurrenceForm({ seriesId, occurrence, onDone });
  const scopes = [
    { id: "THIS", name: t("scope.this") },
    { id: "FOLLOWING", name: t("scope.following") },
  ];
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <OptionSelectField
          control={form.control}
          name="scope"
          label={t("fields.scope")}
          options={scopes}
        />
        <OccurrenceChangeFields form={form} rooms={rooms} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
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
