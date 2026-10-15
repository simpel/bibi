import type { OccupancyDto } from "@okazi/core";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { OccupancyTypeField } from "./occupancy-type-field";
import { useOccupancyForm } from "./use-occupancy-form";

export type OccupancyFormProps = {
  itemId: string;
  occupancy?: OccupancyDto | undefined;
  onDone: () => void;
};

/** Create or edit a block of a bookable item: type, period and note. */
export function OccupancyForm({ itemId, occupancy, onDone }: OccupancyFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("occupancy.fields");
  const { form, submit, pending } = useOccupancyForm({ itemId, occupancy, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <OccupancyTypeField control={form.control} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            form={form}
            name="startsAt"
            label={t("startsAt")}
            type="datetime-local"
            required
          />
          <TextField form={form} name="endsAt" label={t("endsAt")} type="datetime-local" required />
        </div>
        <TextField form={form} name="note" label={t("note")} multiline rows={2} />
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
