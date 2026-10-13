"use client";

import type { VenueCreateInput, VenueDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, DialogFooter, toast } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ErrorBanner } from "@/components/states/error-banner";
import { useActionSubmit } from "@/lib/use-action-submit";
import { createVenueAction, updateVenueAction } from "../actions";
import { useVenueForm } from "./use-venue-form";
import { VenueFormFields } from "./venue-form-fields";

export type VenueFormProps = { venue?: VenueDto | undefined; onDone: () => void };

/** Create (no `venue`) or edit form; saves through the venue server actions. */
export function VenueForm({ venue, onDone }: VenueFormProps) {
  const t = useTranslations("venue");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useVenueForm({ venue });
  const { pending, errorKey, run } = useActionSubmit<VenueDto>({
    onSuccess: () => {
      toast.success(t(venue ? "updated" : "created"));
      router.refresh();
      onDone();
    },
  });
  const save = ({ values }: { values: VenueCreateInput }) =>
    venue
      ? updateVenueAction({ input: { id: venue.id, ...values } })
      : createVenueAction({ input: values });
  const onSubmit = form.handleSubmit((values) => run({ action: () => save({ values }) }));
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <ErrorBanner errorKey={errorKey} />
      <VenueFormFields form={form} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {common("cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {common("save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
