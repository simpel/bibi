"use client";

import type { VenueCreateInput, VenueDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useFormAction } from "@/lib/use-form-action";
import { createVenueAction, updateVenueAction } from "../actions";
import { useVenueForm } from "./use-venue-form";
import { VenueFormFields } from "./venue-form-fields";

export type VenueFormProps = { venue?: VenueDto | undefined; onDone: () => void };

const save = ({ venue, values }: { venue: VenueDto | undefined; values: VenueCreateInput }) =>
  venue
    ? updateVenueAction({ input: { id: venue.id, ...values } })
    : createVenueAction({ input: values });

/**
 * Create (no `venue`) or edit form. Reference for forms (CLAUDE.md "Forms"): shadcn `Form`,
 * core schema via the resolver, server action through `useFormAction` with one toast per save.
 */
export function VenueForm({ venue, onDone }: VenueFormProps) {
  const t = useTranslations("venue");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useVenueForm({ venue });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => save({ venue, values }),
    messages: { pending: common("saving"), success: t(venue ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
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
    </Form>
  );
}
